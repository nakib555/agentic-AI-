
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getApiKey, getProvider } from './settingsHandler';
import { listAvailableModels } from './services/modelService';

export const getAvailableModelsHandler = async (req: any, res: any) => {
    const provider = await getProvider();
    const apiKey = await getApiKey();

    // If provider is NOT ollama, we mandate an API key.
    // For Ollama, we proceed even without a key (as it uses host URL).
    if (provider !== 'ollama' && !apiKey) {
        return res.status(200).json({ models: [], imageModels: [], videoModels: [], ttsModels: [] });
    }

    try {
        // Pass the key we have (or undefined for Ollama)
        const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(apiKey || '');
        
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
