
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';
import { readData, SETTINGS_FILE_PATH } from '../data-store';
import { getProvider } from '../providers/registry';

// Cache structure
type ModelCache = {
    keyHash: string;
    provider: string;
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

export async function listAvailableModels(apiKey: string, forceRefresh = false): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    // 1. Get Settings
    const settings: any = await readData(SETTINGS_FILE_PATH);
    const providerId = settings.provider || 'gemini';
    const ollamaHost = settings.ollamaHost || '';
    
    // 2. Check Cache
    const currentKeyHash = (apiKey || '').trim().slice(-8) + providerId + ollamaHost;
    const now = Date.now();

    if (
        !forceRefresh &&
        modelCache && 
        modelCache.provider === providerId &&
        modelCache.keyHash === currentKeyHash &&
        (now - modelCache.timestamp < CACHE_TTL)
    ) {
        console.log('[ModelService] Returning cached models.');
        return modelCache.data;
    }

    // 3. Dynamic Fetch using Provider Registry
    console.log(`[ModelService] Fetching models for provider: ${providerId}`);
    
    const provider = getProvider(providerId);
    let rawModels: AppModel[] = [];
    
    try {
        rawModels = await provider.getModels(apiKey);
    } catch (e) {
        console.error(`[ModelService] Failed to fetch models for ${providerId}`, e);
    }

    // 4. Categorize Models (Heuristics)
    // Note: Some providers (like Gemini) might return capability flags, others (OpenRouter) just IDs.
    // We apply heuristics here to split them into UI categories.
    
    const chatModels: AppModel[] = [];
    const imageModels: AppModel[] = [];
    const videoModels: AppModel[] = [];
    const ttsModels: AppModel[] = [];

    for (const m of rawModels) {
        const id = m.id.toLowerCase();
        
        // Video
        if (id.includes('video') || id.includes('veo') || id.includes('sora') || id.includes('runway') || id.includes('luma')) {
            videoModels.push(m);
            continue;
        }

        // Image
        if (id.includes('image') || id.includes('diffusion') || id.includes('dall-e') || id.includes('midjourney') || id.includes('flux')) {
            imageModels.push(m);
            continue;
        }

        // Audio/TTS
        if (id.includes('tts') || id.includes('speech') || id.includes('audio') || id.includes('eleven')) {
            ttsModels.push(m);
            continue;
        }

        // Default to Chat
        chatModels.push(m);
    }

    // Special case: Ensure Gemini TTS model is present if using Gemini
    if (providerId === 'gemini') {
         const knownTtsId = 'gemini-2.5-flash-preview-tts';
         if (!ttsModels.some(m => m.id === knownTtsId)) {
             ttsModels.push({ id: knownTtsId, name: 'Gemini 2.5 Flash TTS', description: 'Native TTS' });
         }
    }

    const result = { chatModels, imageModels, videoModels, ttsModels };

    // 5. Update Cache
    modelCache = {
        keyHash: currentKeyHash,
        provider: providerId,
        data: result,
        timestamp: now
    };

    return result;
}
