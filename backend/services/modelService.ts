
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';
import { readData, SETTINGS_FILE_PATH } from '../data-store';
import { providerRegistry } from '../providers/registry';
import { ModelLists } from '../providers/types';

// Cache structure
type ModelCache = {
    keyHash: string;
    provider: string;
    data: ModelLists;
    timestamp: number;
};

let modelCache: ModelCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function listAvailableModels(apiKey: string, forceRefresh = false): Promise<ModelLists> {
    // Determine provider from settings
    const settings: any = await readData(SETTINGS_FILE_PATH);
    const providerId = settings.provider || 'gemini';
    
    // Hash key + provider to ensure cache validity
    const currentKeyHash = (apiKey || '').trim().slice(-8) + providerId;
    const now = Date.now();

    // Check cache first
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

    try {
        const provider = await providerRegistry.getProvider(providerId);
        const result = await provider.getModels(apiKey);

        // Update cache
        modelCache = {
            keyHash: currentKeyHash,
            provider: providerId,
            data: result,
            timestamp: now
        };

        return result;

    } catch (error: any) {
        console.error(`[ModelService] Failed to fetch models for provider ${providerId}:`, error);
        return {
            chatModels: [],
            imageModels: [],
            videoModels: [],
            ttsModels: []
        };
    }
}
