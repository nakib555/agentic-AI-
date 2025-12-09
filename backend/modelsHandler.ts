
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'hono';
import { getApiKey } from './settingsHandler.js';
import { listAvailableModels } from './services/modelService.js';

export const getAvailableModelsHandler = async (c: Context) => {
    const apiKey = await getApiKey(c);
    if (!apiKey) {
        return c.json({ models: [], imageModels: [], videoModels: [], ttsModels: [] });
    }

    try {
        const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(apiKey);
        return c.json({
            models: chatModels,
            imageModels,
            videoModels,
            ttsModels,
        });
    } catch (error: any) {
        console.error("Error in getAvailableModelsHandler:", error.message);
        return c.json({ 
            error: "An error occurred while fetching models.",
            models: [], 
            imageModels: [], 
            videoModels: [],
            ttsModels: []
        }, 500);
    }
};
