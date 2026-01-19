


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SETTINGS_FILE_PATH, readData, writeData } from './data-store';
import { listAvailableModels } from './services/modelService';

// In-memory cache for settings to avoid reading disk on every request
let cachedSettings: any = null;

const ensureSettingsLoaded = async () => {
    if (!cachedSettings) {
        try {
            cachedSettings = await readData(SETTINGS_FILE_PATH);
        } catch (error) {
            console.error('Failed to load settings into cache:', error);
            throw error;
        }
    }
    return cachedSettings;
};

export const getSettings = async (req: any, res: any) => {
    try {
        const settings = await ensureSettingsLoaded();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Failed to get settings:', error);
        res.status(500).json({ error: 'Failed to retrieve settings.' });
    }
};

export const updateSettings = async (req: any, res: any) => {
    try {
        const currentSettings = await ensureSettingsLoaded();
        const updates = req.body;
        
        const newSettings = { ...currentSettings, ...updates };
        cachedSettings = newSettings;
        await writeData(SETTINGS_FILE_PATH, newSettings);

        // Check if critical settings changed (Provider or API Key)
        const providerChanged = updates.provider && updates.provider !== currentSettings.provider;
        
        // For Ollama, we trigger a refresh if the provider is Ollama and *any* update occurred to key.
        // This allows the "Save" button to act as a "Refresh Models" trigger even if values haven't strictly changed.
        const isOllamaRefresh = newSettings.provider === 'ollama' && ('apiKey' in updates || providerChanged);
        
        const keyChanged = (newSettings.provider === 'gemini' && updates.apiKey !== currentSettings.apiKey) ||
                           (newSettings.provider === 'openrouter' && updates.openRouterApiKey !== currentSettings.openRouterApiKey) ||
                           isOllamaRefresh;

        if (providerChanged || keyChanged) {
            try {
                // Fetch models based on the NEW provider and NEW key/host
                const activeKey = newSettings.provider === 'openrouter' 
                    ? newSettings.openRouterApiKey 
                    : newSettings.apiKey;
                
                // Allow fetching without key for Ollama if user just switched to it or updated settings
                if (activeKey || newSettings.provider === 'ollama') {
                    const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(activeKey || '', true);
                    res.status(200).json({ ...newSettings, models: chatModels, imageModels, videoModels, ttsModels });
                    return;
                }
            } catch (error) {
                // If fetching models fails just return settings
                console.error("Model fetch failed during settings update:", error);
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
        const settings = await ensureSettingsLoaded();
        if (settings.provider === 'openrouter') {
            return settings.openRouterApiKey;
        }
        return settings.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
    } catch (error) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
};

export const getGeminiApiKey = async (): Promise<string | undefined> => {
    try {
        const settings = await ensureSettingsLoaded();
        return settings.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
    } catch (error) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
};

export const getProvider = async (): Promise<string> => {
    try {
        const settings = await ensureSettingsLoaded();
        return settings.provider || 'gemini';
    } catch (error) {
        return 'gemini';
    }
};
