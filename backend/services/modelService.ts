/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import type { Model } from '../../src/types';

// Helper function to sort models alphabetically by display name for a consistent UI.
const sortModelsByName = (models: Model[]): Model[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetches the list of available Gemini models using the @google/genai SDK.
 * @param apiKey The Gemini API key.
 * @returns An object containing categorized lists of available models.
 */
export async function listAvailableModels(apiKey: string): Promise<{
    chatModels: Model[];
    imageModels: Model[];
    videoModels: Model[];
}> {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const modelList = await ai.models.list();

        const availableChatModels: Model[] = [];
        const availableImageModels: Model[] = [];
        const availableVideoModels: Model[] = [];

        // FIX: The `list()` method returns a `Pager` which is an async iterable. Iterate over it directly.
        for await (const model of modelList) {
            const modelId = model.name.replace('models/', '');
            const modelInfo: Model = {
                id: modelId,
                name: model.displayName,
                description: model.description,
            };

            const methods = model.supportedGenerationMethods || [];

            if (methods.includes('generateVideos')) {
                availableVideoModels.push(modelInfo);
            } else if (methods.includes('generateImages')) {
                availableImageModels.push(modelInfo);
            } else if (methods.includes('generateContent')) {
                if (modelId.includes('image')) {
                    availableImageModels.push(modelInfo);
                } else if (!modelId.includes('tts') && !modelId.includes('audio')) {
                    availableChatModels.push(modelInfo);
                }
            }
        }

        return {
            chatModels: sortModelsByName(availableChatModels),
            imageModels: sortModelsByName(availableImageModels),
            videoModels: sortModelsByName(availableVideoModels),
        };
    } catch (error: any) {
        console.warn('API Key validation or model fetch failed:', error.message);
        // On failure (e.g., invalid key), return empty arrays gracefully.
        return { chatModels: [], imageModels: [], videoModels: [] };
    }
}
