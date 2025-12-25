
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';

// Cache structure
type ModelCache = {
    keyHash: string; // Store a combined hash of both keys
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

// Helper for fetching with retry
const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const delay = backoff * Math.pow(2, i);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            const delay = backoff * Math.pow(2, i);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return await fetch(url, options);
};

// Fetch Google Models
async function fetchGoogleModels(apiKey: string): Promise<AppModel[]> {
    if (!apiKey) return [];
    try {
        const response = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: { 'x-goog-api-key': apiKey }
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        return (data.models || []).map((m: any) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name,
            description: m.description || '',
            tags: ['google']
        }));
    } catch (e) {
        console.warn('[ModelService] Failed to fetch Google models:', e);
        return [];
    }
}

// Fetch OpenRouter Models
async function fetchOpenRouterModels(apiKey: string): Promise<AppModel[]> {
    if (!apiKey) return [];
    try {
        const response = await fetchWithRetry('https://openrouter.ai/api/v1/models', {
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        return (data.data || []).map((m: any) => ({
            id: m.id, // OpenRouter IDs are typically "vendor/model-name"
            name: m.name,
            description: m.description || '',
            tags: ['openrouter']
        }));
    } catch (e) {
        console.warn('[ModelService] Failed to fetch OpenRouter models:', e);
        return [];
    }
}

/**
 * Fetches the list of available models from Google and OpenRouter.
 */
export async function listAvailableModels(googleApiKey: string, openRouterApiKey: string, forceRefresh = false): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    const currentKeyHash = `${googleApiKey?.slice(-8)}_${openRouterApiKey?.slice(-8)}`;
    const now = Date.now();

    // Check cache first
    if (!forceRefresh && modelCache && modelCache.keyHash === currentKeyHash && (now - modelCache.timestamp < CACHE_TTL)) {
        console.log('[ModelService] Returning cached models.');
        return modelCache.data;
    }

    console.log('[ModelService] Fetching models...');
    const [googleModels, openRouterModels] = await Promise.all([
        fetchGoogleModels(googleApiKey),
        fetchOpenRouterModels(openRouterApiKey)
    ]);

    const allModels = [...googleModels, ...openRouterModels];
    
    const availableChatModels: AppModel[] = [];
    const availableImageModels: AppModel[] = [];
    const availableVideoModels: AppModel[] = [];
    const availableTtsModels: AppModel[] = [];

    // Filter Google Models
    googleModels.forEach(m => {
        const lowerId = m.id.toLowerCase();
        if (lowerId.includes('veo') || lowerId.includes('video')) availableVideoModels.push(m);
        else if (lowerId.includes('tts')) availableTtsModels.push(m);
        else if (lowerId.includes('imagen') || lowerId.includes('flash-image')) availableImageModels.push(m);
        else if (!lowerId.includes('embedding') && !lowerId.includes('aqa')) availableChatModels.push(m);
    });

    // Filter OpenRouter Models (mostly Chat, some might be multimodal but usually treated as chat models in standard listings)
    openRouterModels.forEach(m => {
        // Simple heuristic: Most OpenRouter models are for chat/completion
        // unless explicitly marked otherwise (rare in standard list).
        // We add them all to chat for now.
        availableChatModels.push(m);
    });

    // Ensure known critical models are present
    const knownTtsModelId = 'gemini-2.5-flash-preview-tts';
    if (!availableTtsModels.some(m => m.id === knownTtsModelId)) {
         availableTtsModels.push({ id: knownTtsModelId, name: 'Gemini 2.5 Flash TTS', description: 'Text-to-speech capabilities' });
    }

    const result = {
        chatModels: sortModelsByName(availableChatModels),
        imageModels: sortModelsByName(availableImageModels),
        videoModels: sortModelsByName(availableVideoModels),
        ttsModels: sortModelsByName(availableTtsModels),
    };

    modelCache = { keyHash: currentKeyHash, data: result, timestamp: now };
    return result;
}
