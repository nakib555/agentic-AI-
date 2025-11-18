
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';

// Helper function to sort models alphabetically by display name for a consistent UI.
const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetches the list of available Gemini models using the REST API directly.
 * @param apiKey The Gemini API key.
 * @returns An object containing categorized lists of available models.
 */
export async function listAvailableModels(apiKey: string): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
}> {
    try {
        // Using fetch with the REST API endpoint to get the list of models.
        // We pass the API key in the header for security.
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: {
                'x-goog-api-key': apiKey
            }
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const modelList = data.models || [];

        const availableChatModels: AppModel[] = [];
        const availableImageModels: AppModel[] = [];
        const availableVideoModels: AppModel[] = [];

        for (const model of modelList) {
            // Model names in REST API are like "models/gemini-1.5-flash"
            // We strip the prefix to get the ID used for generation requests.
            const modelId = model.name.replace('models/', '');
            const modelInfo: AppModel = {
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
