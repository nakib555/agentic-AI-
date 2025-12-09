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

// Helper for fetching with retry on 429
const fetchWithRetry = async (url: string, options: any, retries = 5, backoff = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const delay = backoff * Math.pow(2, i) + (Math.random() * 500);
                console.warn(`[ModelService] Rate limit hit fetching models. Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            return response;
        } catch (e) {
            // If it's a network error (not a status code error), retry as well
            if (i === retries - 1) throw e;
            const delay = backoff * Math.pow(2, i);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    // Final attempt
    return await fetch(url, options);
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
        const response = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/models', {
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
            // The API returns names like "models/gemini-1.5-pro". We strip the prefix for the SDK.
            const modelId = model.name.replace('models/', '');
            const modelInfo: AppModel = {
                id: modelId,
                name: model.displayName || modelId,
                description: model.description || '',
            };

            const methods = model.supportedGenerationMethods || [];
            const lowerId = modelId.toLowerCase();

            // 1. Video Models (Veo checking)
            // Explicitly check for 'generateVideos' capability OR 'veo' in the name for dynamic detection.
            if (methods.includes('generateVideos') || lowerId.includes('veo')) {
                availableVideoModels.push(modelInfo);
                continue; // Specialized model
            }

            // 2. Audio/TTS Models
            if (lowerId.includes('tts')) {
                availableTtsModels.push(modelInfo);
                continue; // Specialized model
            }

            // 3. Image Models (Imagen checking)
            // Checks for 'generateImages' capability OR specific naming conventions like 'imagen' or 'flash-image'
            if (methods.includes('generateImages') || lowerId.includes('imagen') || lowerId.includes('flash-image')) {
                availableImageModels.push(modelInfo);
                
                // If the model *also* supports content generation (like flash-image might in future),
                // we might want it in chat, but generally dedicated image models are separate.
                if (lowerId.includes('imagen')) {
                    continue;
                }
            }

            // 4. Chat/Text Models (Default bucket for generateContent)
            // Exclude specialized models (embeddings, aqa) that aren't for general chat.
            if (methods.includes('generateContent') && !lowerId.includes('embedding') && !lowerId.includes('aqa')) {
                availableChatModels.push(modelInfo);
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
        throw error;
    }
}