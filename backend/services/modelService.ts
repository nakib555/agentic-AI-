
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel } from '../../src/types';
import { readData, SETTINGS_FILE_PATH } from '../data-store';

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

async function fetchOllamaModels(host: string, apiKey?: string): Promise<AppModel[]> {
    try {
        console.log(`[ModelService] Fetching models for Ollama...`);
        
        // Use the public registry URL as requested by the user, which doesn't require an API key
        // url curl https://ollama.com/api/tags
        const url = 'https://ollama.com/api/tags';
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        console.log(`[ModelService] Requesting models from registry: ${url}`);
        const response = await fetch(url, { 
            method: 'GET',
            headers 
        });
        
        if (!response.ok) {
            console.warn(`[ModelService] Public registry ${url} failed with ${response.status}. Falling back to host tags at ${host}.`);
            // Fallback to the local host's tags API which is the standard Ollama behavior
            const fallbackUrl = `${host.replace(/\/$/, '')}/api/tags`;
            const fallbackHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) fallbackHeaders['Authorization'] = `Bearer ${apiKey}`;
            
            const fallbackRes = await fetch(fallbackUrl, { headers: fallbackHeaders });
            if (!fallbackRes.ok) throw new Error("Both registry and host tags failed.");
            const data = await fallbackRes.json();
            
            const models: AppModel[] = (data.models || []).map((m: any) => ({
                id: m.name, 
                name: m.name,
                description: `${m.details?.parameter_size || ''} ${m.details?.quantization_level || ''} (${m.details?.family || 'Ollama'})`,
            }));
            return sortModelsByName(models);
        }

        const data = await response.json();
        
        // The registry format might differ slightly from the runner format. 
        // We attempt to map it safely.
        const models: AppModel[] = (data.models || []).map((m: any) => ({
            id: m.name, 
            name: m.name,
            description: m.description || `Ollama Model (${m.name})`,
        }));
        
        return sortModelsByName(models);
    } catch (error: any) {
        console.error('[ModelService] Failed to fetch Ollama models:', error);
        // On total failure, return common defaults so the UI remains functional
        return [
            { id: 'llama3', name: 'Llama 3', description: 'Meta Llama 3 (Ollama)' },
            { id: 'mistral', name: 'Mistral', description: 'Mistral 7B (Ollama)' },
            { id: 'deepseek-v3', name: 'DeepSeek V3', description: 'DeepSeek Reasoning (Ollama)' },
            { id: 'phi3', name: 'Phi-3', description: 'Microsoft Phi-3 (Ollama)' }
        ];
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
    const ollamaHost = settings.ollamaHost || 'http://127.0.0.1:11434';
    
    // Hash key + provider + host to ensure cache validity
    const currentKeyHash = (apiKey || '').trim().slice(-8) + provider + ollamaHost;
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

    let result;
    
    if (provider === 'ollama') {
        // Pass apiKey if available for authenticated Ollama
        const models = await fetchOllamaModels(ollamaHost, apiKey);
        result = {
            chatModels: models,
            imageModels: [], // Ollama mainly supports chat/text currently
            videoModels: [],
            ttsModels: []
        };
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
                id.includes('svd') ||
                id.includes('cogvideo') ||
                id.includes('animatediff') ||
                id.includes('vidu') ||
                id.includes('haiper') ||
                id.includes('minimax') ||
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
        result = await fetchGeminiModels(apiKey);
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
