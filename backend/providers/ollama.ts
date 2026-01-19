
import { AIProvider, ChatOptions, StreamCallbacks } from './types';
import type { Model as AppModel } from '../../src/types';
import { streamOllama } from '../utils/ollamaUtils';
import { readData, SETTINGS_FILE_PATH } from '../data-store';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama';

    private async getHost(): Promise<string> {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        // Default to localhost, or use user setting
        let host = settings.ollamaHost || 'http://127.0.0.1:11434';
        return host.replace(/\/$/, '');
    }

    async getModels(apiKey: string): Promise<AppModel[]> {
        // Ollama usually uses host. apiKey is optional (e.g. for auth proxies).
        // We do NOT mandate an API key here, matching `https://ollama.com/api/tags` behavior
        // which is public.
        const host = await this.getHost();
        try {
            const url = `${host}/api/tags`;
            const headers: any = {};
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

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
            // No hardcoded fallback. Return empty to indicate failure/no models found.
            // This forces the user to fix their configuration rather than seeing a fake 'Llama 3'.
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

        // streamOllama internally handles fetching the host from settings
        await streamOllama(apiKey, model, ollamaMessages, callbacks, {
            temperature: options.temperature
        });
    }
}
