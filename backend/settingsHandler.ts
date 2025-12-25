/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SETTINGS_FILE_PATH, readData, writeData } from './data-store.js';
import { listAvailableModels } from './services/modelService.js';

export const getSettings = async (req: any, res: any) => {
    try {
        const settings = await readData(SETTINGS_FILE_PATH);
        res.status(200).json(settings);
    } catch (error) {
        console.error('Failed to get settings:', error);
        res.status(500).json({ error: 'Failed to retrieve settings.' });
    }
};

export const updateSettings = async (req: any, res: any) => {
    try {
        const currentSettings: any = await readData(SETTINGS_FILE_PATH);
        const updates = req.body;
        
        const newSettings = { ...currentSettings, ...updates };
        await writeData(SETTINGS_FILE_PATH, newSettings);

        // If either API Key is updated, fetch and return merged models
        if (
            (updates.apiKey && updates.apiKey !== currentSettings.apiKey) ||
            (updates.openRouterApiKey && updates.openRouterApiKey !== currentSettings.openRouterApiKey)
        ) {
            try {
                // Pass both keys to the model listing service
                const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(
                    updates.apiKey || currentSettings.apiKey,
                    updates.openRouterApiKey || currentSettings.openRouterApiKey,
                    true // Force refresh
                );
                res.status(200).json({ ...newSettings, models: chatModels, imageModels, videoModels, ttsModels });
                return;
            } catch (error) {
                // If fetching models fails, just return settings
                console.warn("[Settings] Model fetch failed after key update");
            }
        }

        res.status(200).json(newSettings);
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
};

export const getApiKey = async (): Promise<string | undefined> => {
    try {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        return settings.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
    } catch (error) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
};

export const getOpenRouterApiKey = async (): Promise<string | undefined> => {
    try {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        return settings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    } catch (error) {
        return process.env.OPENROUTER_API_KEY;
    }
};

export const getSuggestionApiKey = async (): Promise<string | undefined> => {
    try {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        return settings.suggestionApiKey || process.env.SUGGESTION_API_KEY;
    } catch (error) {
        return process.env.SUGGESTION_API_KEY;
    }
};
