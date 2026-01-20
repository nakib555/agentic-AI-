
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AIProvider, ChatOptions, CompletionOptions, ModelLists } from './types';
import type { Model as AppModel } from '../../src/types';
import { readData, SETTINGS_FILE_PATH } from '../data-store';

const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

const getEffectiveEndpoint = async (): Promise<string> => {
    let host = '';
    try {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        host = settings.ollamaHost || '';
    } catch (e) {
        // Ignore errors reading settings, fall back to env
    }
    
    if (!host) {
        host = process.env.OLLAMA_HOST || '';
    }

    // Normalization Logic
    host = host.trim().replace(/\/$/, ''); // Remove trailing slash
    
    // Remove explicit endpoint suffixes if user accidentally pasted full URL
    host = host.replace(/\/api\/chat$/, '').replace(/\/api\/tags$/, '');

    // Ensure protocol exists (Node.js fetch requires it)
    if (host && !host.startsWith('http://') && !host.startsWith('https://')) {
        host = `http://${host}`;
    }
    
    return host;
};

const OllamaProvider: AIProvider = {
    id: 'ollama',
    name: 'Ollama',

    async getModels(apiKey: string): Promise<ModelLists> {
        try {
            const effectiveEndpoint = await getEffectiveEndpoint();
            
            // If no endpoint is configured (empty string), return empty lists immediately
            if (!effectiveEndpoint) {
                return { chatModels: [], imageModels: [], videoModels: [], ttsModels: [] };
            }

            const url = `${effectiveEndpoint}/api/tags`;
            
            console.log(`[OllamaProvider] Fetching installed models from: ${url}`);
            
            const response = await fetch(url, { 
                method: 'GET', 
                headers: { 
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
                } 
            });
            
            if (!response.ok) {
                 throw new Error(`Local instance unreachable at ${url}. Status: ${response.status}`);
            }
    
            const data = await response.json();
            const models: AppModel[] = (data.models || []).map((m: any) => ({
                id: m.name, 
                name: m.name,
                description: m.details ? `${m.details.parameter_size} parameters | ${m.details.quantization_level}` : `Ollama Model (${m.name})`,
            }));
            
            const sorted = sortModelsByName(models);
            
            return {
                chatModels: sorted,
                imageModels: [],
                videoModels: [],
                ttsModels: []
            };
        } catch (error: any) {
            console.error('[OllamaProvider] Failed to fetch models:', error.message);
            
            // Return empty list instead of throwing to prevent UI crash
            return {
                chatModels: [],
                imageModels: [],
                videoModels: [],
                ttsModels: []
            };
        }
    },

    async chat(options: ChatOptions): Promise<void> {
        const { model, messages, systemInstruction, temperature, callbacks, apiKey, signal } = options;

        const effectiveEndpoint = await getEffectiveEndpoint();
        if (!effectiveEndpoint) {
            callbacks.onError(new Error("Ollama host URL is not configured. Please set it in Settings."));
            return;
        }

        const ollamaMessages = messages
            .filter(m => !m.isHidden)
            .map(msg => {
                let content = '';
                if (msg.role === 'user') {
                     content = msg.versions?.[msg.activeVersionIndex ?? 0]?.text || msg.text || '';
                } else {
                     content = msg.responses?.[msg.activeResponseIndex]?.text || msg.text || '';
                }
                return {
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content
                };
            });
        
        if (systemInstruction) {
            ollamaMessages.unshift({ role: 'system', content: systemInstruction });
        }

        try {
            console.log(`[OllamaProvider] Connecting to chat endpoint: ${effectiveEndpoint}/api/chat`);
            const response = await fetch(`${effectiveEndpoint}/api/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
                },
                body: JSON.stringify({
                    model,
                    messages: ollamaMessages,
                    stream: true,
                    options: { temperature }
                }),
                signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama Error (${response.status}): ${errorText}`);
            }
            
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";
            let buffer = "";

            while (true) {
                if (signal?.aborted) break;
                const { done, value } = await reader.read();
                
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                }

                const lines = buffer.split("\n");
                buffer = done ? '' : lines.pop() || ''; // Keep partial line

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.message && data.message.content) {
                            const contentChunk = data.message.content;
                            callbacks.onTextChunk(contentChunk);
                            fullText += contentChunk;
                        }
                        if (data.done) break;
                    } catch (e) { }
                }
                
                if (done) break;
            }
            
            callbacks.onComplete({ finalText: fullText });

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                const msg = error.message || '';
                if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
                    if (effectiveEndpoint.includes('127.0.0.1') || effectiveEndpoint.includes('localhost')) {
                         callbacks.onError(new Error("Failed to connect to Ollama at localhost. If you are running this app in the cloud (e.g. Render/Vercel), it cannot access your local computer. You must deploy Ollama publicly or use a tunnel like ngrok."));
                    } else {
                         callbacks.onError(new Error(`Failed to connect to Ollama at ${effectiveEndpoint}. Please check if the server is running and accessible.`));
                    }
                } else {
                    callbacks.onError(error);
                }
            }
        }
    },

    async complete(options: CompletionOptions): Promise<string> {
        const { model, prompt, systemInstruction, apiKey, jsonMode } = options;
        const effectiveEndpoint = await getEffectiveEndpoint();
        
        if (!effectiveEndpoint) return '';

        try {
             const messages = [];
             if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
             messages.push({ role: 'user', content: prompt });
             
             const resp = await fetch(`${effectiveEndpoint}/api/chat`, {
                 method: 'POST',
                 headers: { 
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
                 },
                 body: JSON.stringify({
                     model: model,
                     messages,
                     stream: false,
                     format: jsonMode ? "json" : undefined
                 })
             });
             
             if (!resp.ok) return '';
             const data = await resp.json();
             return data.message?.content || '';
        } catch(e) {
             console.error("Ollama completion error:", e);
             return '';
        }
    }
};

export default OllamaProvider;
