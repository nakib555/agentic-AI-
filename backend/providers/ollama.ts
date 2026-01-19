
import { AIProvider, ChatOptions, StreamCallbacks } from './types';
import type { Model as AppModel } from '../../src/types';
import { streamOllama } from '../utils/ollamaUtils';
import { readData, SETTINGS_FILE_PATH } from '../data-store';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama';

    private async getHost(): Promise<string> {
        // Default to 127.0.0.1 to avoid Node.js localhost IPv6 issues
        const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        return host.replace(/\/$/, '');
    }

    async getModels(apiKey: string): Promise<AppModel[]> {
        // Ollama usually uses host. apiKey is optional (e.g. for auth proxies).
        // We do NOT mandate an API key here, matching `GET /api/tags` behavior
        // which is public on the local instance.
        const host = await this.getHost();
        try {
            const url = `${host}/api/tags`;
            
            // Only attach Authorization header if a key is actually provided and non-empty.
            // This ensures standard local instances (which reject Auth headers) work out of the box.
            const headers: Record<string, string> = {};
            if (apiKey && apiKey.trim().length > 0) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            console.log(`[OllamaProvider] Fetching models from ${url} ${Object.keys(headers).length > 0 ? '(Authenticated)' : '(No Auth)'}`);

            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                 const text = await response.text();
                 throw new Error(`Failed to fetch Ollama models from ${url}. Status: ${response.status}. ${text}`);
            }
            
            const data = await response.json();
            
            // Map Ollama /api/tags format to AppModel
            return (data.models || []).map((m: any) => ({
                id: m.name,
                name: m.name,
                description: m.details?.family ? `${m.details.family} (${m.details.parameter_size || '?'})` : 'Local Model'
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));

        } catch (e: any) {
            console.error("Ollama fetch failed:", e.message);
            // Return empty to indicate failure/no models found.
            return [];
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

        const host = await this.getHost();

        // Pass the host explicitly to the streaming utility
        await streamOllama(apiKey, model, ollamaMessages, callbacks, {
            temperature: options.temperature
        }, host);
    }
}
