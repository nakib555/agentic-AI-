
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getApiKey, getOpenRouterApiKey } from './settingsHandler.js';
import { listAvailableModels } from './services/modelService.js';

export const getAvailableModelsHandler = async (req: any, res: any) => {
    const apiKey = await getApiKey();
    const openRouterKey = await getOpenRouterApiKey();

    if (!apiKey && !openRouterKey) {
        // If no key is configured, return empty lists without hitting the API.
        return res.status(200).json({ models: [], imageModels: [], videoModels: [], ttsModels: [] });
    }

    try {
        // Pass both keys (empty string if undefined)
        const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(apiKey || '', openRouterKey || '');
        
        res.status(200).json({
            models: chatModels,
            imageModels,
            videoModels,
            ttsModels,
        });

    } catch (error: any) {
        // The service layer logs the specific error.
        // We return a generic server error to the client.
        console.error("Error in getAvailableModelsHandler:", error.message);
        res.status(500).json({ 
            error: "An error occurred while fetching models.",
            models: [], 
            imageModels: [], 
            videoModels: [],
            ttsModels: []
        });
    }
};
