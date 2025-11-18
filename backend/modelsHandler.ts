/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Renamed imported types to resolve conflicts with global Request/Response objects and changed from 'import type' to 'import'.
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { getApiKey } from './settingsHandler.js';
import { listAvailableModels } from './services/modelService.js';

export const getAvailableModelsHandler = async (req: ExpressRequest, res: ExpressResponse) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        // If no key is configured, return empty lists without hitting the API.
        return res.status(200).json({ models: [], imageModels: [], videoModels: [] });
    }

    try {
        const { chatModels, imageModels, videoModels } = await listAvailableModels(apiKey);
        
        res.status(200).json({
            models: chatModels,
            imageModels,
            videoModels,
        });

    } catch (error: any) {
        // The service layer logs the specific error.
        // We return a generic server error to the client.
        console.error("Error in getAvailableModelsHandler:", error.message);
        res.status(500).json({ 
            error: "An error occurred while fetching models.",
            models: [], 
            imageModels: [], 
            videoModels: [] 
        });
    }
};
