
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model } from '../types';

export class OllamaService {
    private static async request(baseUrl: string, endpoint: string, options: RequestInit = {}) {
        let url = baseUrl.replace(/\/$/, '');
        if (!url.startsWith('http')) url = 'http://' + url;
        
        // Mixed Content & Security Check
        const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isTargetHttp = url.startsWith('http:');
        const isTargetLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

        try {
            const response = await fetch(`${url}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.statusText}`);
            }
            return response;
        } catch (error) {
            console.error("Ollama Request Failed:", error);
            
            let msg = "Failed to connect to Ollama.";
            const errMessage = (error as Error).message || '';

            // Detect Mixed Content Blocking (Browser silently fails fetch, resulting in TypeError)
            if (isPageHttps && isTargetHttp && !isTargetLocalhost) {
                 msg = "Security Block: Browsers prevent HTTPS websites from connecting to insecure local IPs (Mixed Content). Please use 'http://localhost:11434', setup HTTPS for Ollama, or run this app locally.";
            } else if (errMessage.includes('fetch') || errMessage.includes('Failed to fetch')) {
                 msg += " Ensure Ollama is running and OLLAMA_ORIGINS='*' is set.";
            } else {
                 msg += ` ${errMessage}`;
            }
            throw new Error(msg);
        }
    }

    static async getModels(baseUrl: string): Promise<Model[]> {
        if (!baseUrl) return [];
        try {
            const response = await this.request(baseUrl, '/api/tags');
            const data = await response.json();
            
            return (data.models || []).map((m: any) => ({
                id: m.name,
                name: m.name,
                description: `${m.details?.family || 'Model'} | ${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB`
            }));
        } catch (e: any) {
            console.error("Ollama getModels error:", e);
            // Re-throw with the enhanced message from request()
            throw e; 
        }
    }

    static async *streamChat(baseUrl: string, model: string, messages: any[], options: any) {
        const response = await this.request(baseUrl, '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({
                    role: m.role === 'model' ? 'assistant' : m.role,
                    content: m.text || ''
                })),
                stream: true,
                options: {
                    temperature: options.temperature,
                    num_predict: options.maxOutputTokens
                }
            })
        });

        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer.trim()) {
                    try {
                        const json = JSON.parse(buffer);
                        if (json.message?.content) yield json.message.content;
                    } catch (e) { /* ignore final partial */ }
                }
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last line in the buffer if it's potentially incomplete
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.done) return;
                    if (json.message?.content) {
                        yield json.message.content;
                    }
                } catch (e) {
                    // console.warn("Error parsing Ollama chunk", e);
                }
            }
        }
    }
}
