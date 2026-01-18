
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';
import { readData, SETTINGS_FILE_PATH } from '../data-store';
import { getEffectiveOllamaUrl } from '../settingsHandler';

// Cache structure
type ModelCache = {
    keyHash: string; // Store a simple identifier for the key to invalidate cache on key change
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

// Helper to sort models alphabetically by display name for a consistent UI.
const sortModelsByName = (models: AppModel[]): AppModel[] => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
};

// Helper for fetching with retry on 429
const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 1000): Promise<Response> => {
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

async function fetchOllamaModels(baseUrl: string): Promise<AppModel[]> {
    try {
        let cleanUrl = baseUrl.trim().replace(/\/$/, '');
        
        // Robustness: Ensure protocol is present
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = `http://${cleanUrl}`;
        }
        
        // Intelligent URL handling: If the user provided the full tags endpoint, use it directly.
        // Otherwise, append the standard endpoint.
        let fetchUrl = `${cleanUrl}/api/tags`;
        if (cleanUrl.endsWith('/api/tags')) {
             fetchUrl = cleanUrl;
        }

        console.log(`[ModelService] Fetching models from Ollama at: ${fetchUrl}`);
        
        // Timeout shorter for local network to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('[ModelService] Raw Ollama response:', JSON.stringify(data, null, 2));
        
        // Robust validation for the structure { models: [...] }
        if (!data || !Array.isArray(data.models)) {
            console.warn('[ModelService] Invalid Ollama response structure:', JSON.stringify(data).substring(0, 200));
            return [];
        }

        const models: AppModel[] = data.models.map((m: any) => {
            // Support both 'name' and 'model' keys, defaulting to name
            const modelName = m.name || m.model || 'Unknown Model';
            
            // Format details if available
            const details = m.details || {};
            const parts = [];
            
            // Add Family (e.g. "llama", "qwen3")
            if (details.family) parts.push(details.family);
            
            if (details.parameter_size) parts.push(details.parameter_size);
            if (details.quantization_level) parts.push(details.quantization_level);
            
            // Calculate size in GB if bytes are provided
            if (m.size) {
                const sizeGB = (m.size / (1024 * 1024 * 1024)).toFixed(1);
                parts.push(`${sizeGB}GB`);
            }
            
            const description = parts.length > 0 ? parts.join(' • ') : 'Local Ollama Model';

            return {
                id: modelName,
                name: modelName,
                description: description,
            };
        });

        console.log('[ModelService] Processed Ollama models:', models.map(m => m.name));
        
        return sortModelsByName(models);
    } catch (error) {
        console.error('[ModelService] Failed to fetch Ollama models:', error);
        return [];
    }
}

async function fetchOpenRouterModels(apiKey?: string): Promise<AppModel[]> {
    try {
        console.log('[ModelService] Fetching models from OpenRouter API...');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetchWithRetry('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const models: AppModel[] = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            description: m.description || '',
        }));
        
        return sortModelsByName(models);
    } catch (error) {
        console.error('[ModelService] Failed to fetch OpenRouter models:', error);
        return [];
    }
}

async function fetchGeminiModels(apiKey: string): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    try {
        console.log('[ModelService] Fetching models from Google API...');
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
            const modelId = model.name.replace('models/', '');
            const modelInfo: AppModel = {
                id: modelId,
                name: model.displayName || modelId,
                description: model.description || '',
            };

            const methods = model.supportedGenerationMethods || [];
            const lowerId = modelId.toLowerCase();

            if (methods.includes('generateVideos') || lowerId.includes('veo')) {
                availableVideoModels.push(modelInfo);
                continue; 
            }

            // Enhanced TTS detection: Include 'tts' AND 'audio' but exclude known native-audio chat models
            if (lowerId.includes('tts') || (lowerId.includes('audio') && !lowerId.includes('flash-native-audio') && !lowerId.includes('pro-native-audio'))) {
                availableTtsModels.push(modelInfo);
                continue; 
            }

            if (methods.includes('generateImages') || lowerId.includes('imagen') || lowerId.includes('flash-image') || lowerId.includes('image-preview')) {
                availableImageModels.push(modelInfo);
                // Exclude pure image generation models from the chat list
                if (lowerId.includes('imagen') || lowerId.includes('flash-image') || lowerId.includes('image-preview')) {
                    continue;
                }
            }

            if (methods.includes('generateContent') && !lowerId.includes('embedding') && !lowerId.includes('aqa')) {
                availableChatModels.push(modelInfo);
            }
        }

        const knownTtsModelId = 'gemini-2.5-flash-preview-tts';
        if (!availableTtsModels.some(m => m.id === knownTtsModelId)) {
             availableTtsModels.push({
                id: knownTtsModelId,
                name: 'Gemini 2.5 Flash TTS',
                description: 'Text-to-speech capabilities',
            });
        }

        return {
            chatModels: sortModelsByName(availableChatModels),
            imageModels: sortModelsByName(availableImageModels),
            videoModels: sortModelsByName(availableVideoModels),
            ttsModels: sortModelsByName(availableTtsModels),
        };
    } catch (error: any) {
        console.warn('[ModelService] Model fetch failed with error:', error.message);
        throw error;
    }
}

export async function listAvailableModels(apiKey: string, forceRefresh = false): Promise<{
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}> {
    // Determine provider from settings
    const settings: any = await readData(SETTINGS_FILE_PATH);
    const provider = settings.provider || 'gemini';
    
    // Correctly determine Ollama URL with precedence
    const ollamaUrl = getEffectiveOllamaUrl(settings);
    
    // Simple hash check (using last 8 chars is usually enough to detect a change in the session context)
    const currentKeyHash = (apiKey || '').trim().slice(-8);
    const now = Date.now();

    // Check cache first
    if (
        !forceRefresh &&
        modelCache && 
        modelCache.provider === provider &&
        modelCache.keyHash === currentKeyHash &&
        (now - modelCache.timestamp < CACHE_TTL)
    ) {
        console.log('[ModelService] Returning cached models.');
        return modelCache.data;
    }

    let result = {
        chatModels: [] as AppModel[],
        imageModels: [] as AppModel[],
        videoModels: [] as AppModel[],
        ttsModels: [] as AppModel[]
    };

    if (provider === 'ollama') {
        const ollamaModels = await fetchOllamaModels(ollamaUrl);
        // Ollama models are primarily text/chat
        result.chatModels = ollamaModels;
    } else if (provider === 'openrouter') {
        const allModels = await fetchOpenRouterModels(apiKey);
        
        // Categorize OpenRouter models based on ID keywords
        const chatModels: AppModel[] = [];
        const imageModels: AppModel[] = [];
        const videoModels: AppModel[] = [];
        const ttsModels: AppModel[] = [];

        for (const m of allModels) {
            const id = m.id.toLowerCase();
            
            // Exclude Embeddings
            if (id.includes('embedding') || id.includes('embed')) continue;

            // Video Generation
            if (
                id.includes('veo') || 
                id.includes('sora') || 
                id.includes('luma') || 
                id.includes('runway') || 
                id.includes('svd') || 
                id.includes('cogvideo') || 
                id.includes('kling') ||
                id.includes('animatediff') ||
                id.includes('vidu') ||
                id.includes('haiper') ||
                id.includes('minimax') ||
                id.includes('video')
            ) {
                videoModels.push(m);
                continue;
            }

            // Image Generation
            if (
                id.includes('stable-diffusion') || 
                id.includes('flux') || 
                id.includes('dall-e') || 
                id.includes('midjourney') || 
                id.includes('imagen') || 
                id.includes('kandinsky') || 
                id.includes('playground') ||
                id.includes('ideogram') || 
                id.includes('recraft') ||
                id.includes('auraflow') ||
                id.includes('shakker') ||
                id.includes('image')
            ) {
                imageModels.push(m);
                continue;
            }

            // TTS / Audio
            // Exceptions: Some chat models have 'audio' in the name (e.g. gpt-4o-audio-preview), keep those in Chat.
            if (
                id.includes('tts') || 
                id.includes('whisper') || 
                id.includes('eleven') || 
                id.includes('playht') || 
                id.includes('speech') ||
                (id.includes('audio') && !id.includes('gpt-4o') && !id.includes('gemini') && !id.includes('claude'))
            ) {
                ttsModels.push(m);
                continue;
            }

            // Default to Chat/Reasoning (e.g. aion-labs/aion-1.0)
            chatModels.push(m);
        }

        result = {
            chatModels: sortModelsByName(chatModels),
            imageModels: sortModelsByName(imageModels),
            videoModels: sortModelsByName(videoModels),
            ttsModels: sortModelsByName(ttsModels)
        };
    } else {
        // Gemini Provider
        if (apiKey) {
            result = await fetchGeminiModels(apiKey);
        }
    }

    // Update cache
    modelCache = {
        keyHash: currentKeyHash,
        provider,
        data: result,
        timestamp: now
    };

    return result;
}
