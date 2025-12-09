
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';

// Cache structure
type ModelCache = {
    keyHash: string;
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

// Helper to sort models alphabetically
const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetches the list of available Gemini models using the REST API URL.
 * This satisfies the requirement to "use url to call ai model names".
 */
export async function listAvailableModels(apiKey: string, forceRefresh = false): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    const currentKeyHash = apiKey.trim().slice(-8);
    const now = Date.now();

    if (
        !forceRefresh &&
        modelCache && 
        modelCache.keyHash === currentKeyHash &&
        (now - modelCache.timestamp < CACHE_TTL)
    ) {
        return modelCache.data;
    }

    try {
        console.log('[ModelService] Discovering models via API URL...');
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: { 'x-goog-api-key': apiKey }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const modelList = data.models || [];

        const availableChatModels: AppModel[] = [];
        const availableImageModels: AppModel[] = [];
        const availableVideoModels: AppModel[] = [];
        const availableTtsModels: AppModel[] = [];

        for (const model of modelList) {
            const modelId = model.name.replace('models/', '');
            const modelInfo: AppModel = {
                id: modelId,
                name: model.displayName || modelId,
                description: model.description || '',
            };

            const methods = model.supportedGenerationMethods || [];
            const lowerId = modelId.toLowerCase();

            // 1. Video Models (e.g. Veo)
            if (methods.includes('generateVideos') || lowerId.includes('veo')) {
                availableVideoModels.push(modelInfo);
                continue;
            }

            // 2. Image Models (Imagen or Gemini Flash Image)
            // We ensure we only pick models supported by our library implementation
            if (methods.includes('generateImages') || lowerId.includes('flash-image')) {
                availableImageModels.push(modelInfo);
            }

            // 3. Audio/TTS Models
            if (lowerId.includes('tts') || lowerId.includes('speech')) {
                availableTtsModels.push(modelInfo);
                continue; 
            }

            // 4. Chat/Text Models
            if (methods.includes('generateContent') && !lowerId.includes('tts') && !lowerId.includes('embedding') && !lowerId.includes('aqa')) {
                availableChatModels.push(modelInfo);
            }
        }

        const result = {
            chatModels: sortModelsByName(availableChatModels),
            imageModels: sortModelsByName(availableImageModels),
            videoModels: sortModelsByName(availableVideoModels),
            ttsModels: sortModelsByName(availableTtsModels),
        };

        modelCache = {
            keyHash: currentKeyHash,
            data: result,
            timestamp: now
        };

        return result;
    } catch (error: any) {
        console.warn('[ModelService] Model fetch failed:', error.message);
        throw error;
    }
}
