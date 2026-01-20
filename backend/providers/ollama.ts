
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AIProvider, ChatOptions, CompletionOptions, ModelLists } from './types';
import type { Model as AppModel } from '../../src/types';

const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

const OllamaProvider: AIProvider = {
    id: 'ollama',
    name: 'Ollama',

    async getModels(apiKey: string): Promise<ModelLists> {
        try {
            // Determine the endpoint. Use env var OLLAMA_HOST if present, else default to localhost.
            // only use https://ollama.com/api/tags for modle fetching
            const url = `https://ollama.com/api/tags`;
            
            console.log(`[OllamaProvider] Fetching installed models from: ${url}`);
            
            const response = await fetch(url, { 
                method: 'GET', 
                headers: { 
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
                } 
            });
            
            if (!response.ok) {
                 // Fallback to public registry tags if local connection fails (optional, but good for demo)
                 console.warn(`[OllamaProvider] Failed to reach local instance at ${url}. Trying public registry...`);
                 throw new Error('Local instance unreachable');
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
        } catch (error) {
            console.error('[OllamaProvider] Failed to fetch models:', error);
            
            // Return empty list instead of throwing to prevent UI crash, 
            // allowing user to see "No models available" and fix config.
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

        const effectiveEndpoint = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

        try {
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
                throw new Error(`Ollama Error: ${errorText}`);
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
                callbacks.onError(error);
            }
        }
    },

    async complete(options: CompletionOptions): Promise<string> {
        const { model, prompt, systemInstruction, apiKey, jsonMode } = options;
        const effectiveEndpoint = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        
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
