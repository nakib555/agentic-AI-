
import { AIProvider, ChatOptions, StreamCallbacks } from './types';
import type { Model as AppModel } from '../../src/types';
import { streamOpenRouter } from '../utils/openRouterUtils';

export class OpenRouterProvider implements AIProvider {
    id = 'openrouter';
    name = 'OpenRouter';

    async getModels(apiKey: string): Promise<AppModel[]> {
        if (!apiKey) return [];
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            return (data.data || []).map((m: any) => ({
                id: m.id,
                name: m.name || m.id,
                description: m.description
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error("OpenRouter fetch models failed", e);
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
        // Convert internal message format to OpenAI format
        const openAiMessages = messages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text || ''
        }));

        if (options.systemInstruction) {
            openAiMessages.unshift({ role: 'system', content: options.systemInstruction });
        }

        await streamOpenRouter(apiKey, model, openAiMessages, callbacks, {
            temperature: options.temperature,
            maxTokens: options.maxTokens
        });
    }
}
