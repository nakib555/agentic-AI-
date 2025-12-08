
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';

// Cache structure
type ModelCache = {
    keyHash: string; // Store a simple identifier for the key to invalidate cache on key change
    data: {
        chatModels: AppModel[];
        imageModels: AppModel[];
        videoModels: AppModel[];
        ttsModels: AppModel[];
    };
    timestamp: number;
};

let modelCache: ModelCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to sort models alphabetically by display name for a consistent UI.
const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetches the list of available Gemini models using the REST API directly.
 * @param apiKey The Gemini API key.
 * @param forceRefresh If true, bypasses cache and hits the API.
 * @returns An object containing categorized lists of available models.
 */
export async function listAvailableModels(apiKey: string, forceRefresh = false): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    // Simple hash check (using last 8 chars is usually enough to detect a change in the session context)
    const currentKeyHash = apiKey.trim().slice(-8);
    const now = Date.now();

    // Check cache first
    if (
        !forceRefresh &&
        modelCache && 
        modelCache.keyHash === currentKeyHash &&
        (now - modelCache.timestamp < CACHE_TTL)
    ) {
        console.log('[ModelService] Returning cached models.');
        return modelCache.data;
    }

    try {
        console.log('[ModelService] Fetching models from Google API...');
        // Using fetch with the REST API endpoint to get the list of models.
        // We pass the API key in the header for security.
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: {
                'x-goog-api-key': apiKey
            }
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[ModelService] API Request Failed. Status: ${response.status}, Cause: ${errorBody}`);
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const modelList = data.models || [];
        console.log(`[ModelService] Fetched ${modelList.length} models.`);

        const availableChatModels: AppModel[] = [];
        const availableImageModels: AppModel[] = [];
        const availableVideoModels: AppModel[] = [];
        const availableTtsModels: AppModel[] = [];

        for (const model of modelList) {
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
                } else if (modelId.includes('tts') || modelId.includes('audio')) {
                    availableTtsModels.push(modelInfo);
                } else {
                    availableChatModels.push(modelInfo);
                }
            }
        }

        const result = {
            chatModels: sortModelsByName(availableChatModels),
            imageModels: sortModelsByName(availableImageModels),
            videoModels: sortModelsByName(availableVideoModels),
            ttsModels: sortModelsByName(availableTtsModels),
        };

        // Update cache
        modelCache = {
            keyHash: currentKeyHash,
            data: result,
            timestamp: now
        };

        return result;
    } catch (error: any) {
        console.warn('[ModelService] Model fetch failed with error:', error.message);
        // Do not return empty arrays on verification error; throw so the caller knows the key failed.
        throw error;
    }
}
