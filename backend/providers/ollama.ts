
import { AIProvider, ChatOptions, StreamCallbacks } from './types';
import type { Model as AppModel } from '../../src/types';
import { streamOllama } from '../utils/ollamaUtils';
import { readData, SETTINGS_FILE_PATH } from '../data-store';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama';

    private async getHost(): Promise<string> {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        return settings.ollamaHost || 'http://127.0.0.1:11434';
    }

    async getModels(apiKey: string): Promise<AppModel[]> {
        // Ollama usually uses host, apiKey is optional/auth-proxy dependent
        const host = await this.getHost();
        try {
            // Try public registry first (if accessible) or fallback to local tags
            const url = `${host.replace(/\/$/, '')}/api/tags`;
            const headers: any = {};
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error("Failed to fetch Ollama models");
            
            const data = await response.json();
            return (data.models || []).map((m: any) => ({
                id: m.name,
                name: m.name,
                description: m.details?.family || 'Local Model'
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error("Ollama fetch failed", e);
            // Return fallback
            return [{ id: 'llama3', name: 'Llama 3 (Fallback)', description: 'Ensure Ollama is running' }];
        }
    }

    async chatStream(
        apiKey: string, 
        model: string, 
        messages: any[], 
        options: ChatOptions, 
        callbacks: StreamCallbacks
    ): Promise<void> {
        const ollamaMessages = messages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text || ''
        }));

        if (options.systemInstruction) {
            ollamaMessages.unshift({ role: 'system', content: options.systemInstruction });
        }

        // streamOllama internally handles fetching the host from settings
        await streamOllama(apiKey, model, ollamaMessages, callbacks, {
            temperature: options.temperature
        });
    }
}
