
import { AIProvider, ChatOptions, StreamCallbacks } from './types';
import type { Model as AppModel } from '../../src/types';
import { GoogleGenAI } from "@google/genai";
import { generateContentStreamWithRetry, getText } from '../utils/geminiUtils';
import { transformHistoryToGeminiFormat } from '../utils/historyTransformer';

export class GeminiProvider implements AIProvider {
    id = 'gemini';
    name = 'Google Gemini';

    async getModels(apiKey: string): Promise<AppModel[]> {
        if (!apiKey) return [];
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
                headers: { 'x-goog-api-key': apiKey }
            });
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            
            return (data.models || [])
                .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName,
                    description: m.description
                }))
                .sort((a: any, b: any) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error("Gemini fetch models failed", e);
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
        const ai = new GoogleGenAI({ apiKey });
        const history = transformHistoryToGeminiFormat(messages);

        try {
            const streamResult = await generateContentStreamWithRetry(ai, {
                model,
                contents: history,
                config: {
                    temperature: options.temperature,
                    maxOutputTokens: options.maxTokens > 0 ? options.maxTokens : undefined,
                    systemInstruction: options.systemInstruction
                }
            });

            let fullText = '';
            for await (const chunk of streamResult) {
                const text = getText(chunk);
                if (text) {
                    fullText += text;
                    callbacks.onTextChunk(text);
                }
            }
            callbacks.onComplete(fullText);
        } catch (error) {
            callbacks.onError(error);
        }
    }
}
