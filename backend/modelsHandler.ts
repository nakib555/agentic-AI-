/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Import `Request` and `Response` types from `express` to resolve conflicts with global DOM types.
import type { Request, Response } from 'express';
import { getApiKey } from './settingsHandler.js';
import type { Model } from '../src/types/index.js';

export const getAvailableModelsHandler = async (req: Request, res: Response) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        // If no key is configured, return empty lists.
        return res.status(200).json({ models: [], imageModels: [], videoModels: [] });
    }

    try {
        // Use the Gemini REST API's 'models' endpoint to dynamically list available models.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
            // This failure indicates an invalid API key or permission issue.
            const errorBody = await response.text();
            throw new Error(`Failed to fetch models from Google API: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();

        const availableChatModels: Model[] = [];
        const availableImageModels: Model[] = [];
        const availableVideoModels: Model[] = [];

        for (const model of data.models) {
            // The API returns full names like "models/gemini-2.5-pro", we use the short form.
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
                // This is a broad category. We can distinguish based on model names.
                if (modelId.includes('image')) {
                    availableImageModels.push(modelInfo);
                } else if (!modelId.includes('tts') && !modelId.includes('audio')) {
                    // Assume it's a chat model if it's not specialized for other modalities.
                    availableChatModels.push(modelInfo);
                }
            }
        }
        
        // Sort models alphabetically by their display name for a consistent UI.
        const sortModelsByName = (models: Model[]) => {
            return models.sort((a, b) => a.name.localeCompare(b.name));
        };

        res.status(200).json({
            models: sortModelsByName(availableChatModels),
            imageModels: sortModelsByName(availableImageModels),
            videoModels: sortModelsByName(availableVideoModels),
        });

    } catch (error: any) {
        console.warn('API Key validation or model fetch failed:', error.message);
        // If the key is invalid or the fetch fails, return empty arrays to the client.
        res.status(200).json({ models: [], imageModels: [], videoModels: [] });
    }
};
