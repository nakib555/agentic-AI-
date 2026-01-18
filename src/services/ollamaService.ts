
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model } from '../types';

export class OllamaService {
    private static async request(baseUrl: string, endpoint: string, options: RequestInit = {}) {
        let url = baseUrl.replace(/\/$/, '');
        if (!url.startsWith('http')) url = 'http://' + url;
        
        try {
            const response = await fetch(`${url}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.statusText}`);
            }
            return response;
        } catch (error) {
            console.error("Ollama Request Failed:", error);
            throw new Error("Failed to connect to Ollama. Ensure OLLAMA_ORIGINS='*' is set.");
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
        } catch (e) {
            return [];
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
