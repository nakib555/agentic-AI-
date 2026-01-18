
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
            // Fallback or re-throw depending on severity, but here we likely want to know it failed.
            throw error;
        }
    }
    return cachedSettings;
};

// Helper to determine the effective Ollama URL
// Precedence: 
// 1. User configured non-default value in settings
// 2. Environment Variable
// 3. Stored setting
export const getEffectiveOllamaUrl = (settings: any) => {
    const stored = settings.ollamaUrl;
    const env = process.env.OLLAMA_BASE_URL;
    
    let url = '';
    
    // If user has explicitly changed it to something, respect that.
    if (stored) {
        url = stored;
    } else {
        // Fallback to ENV or empty string
        url = env || '';
    }
    
    // Robustness: Remove trailing dots/ellipses (common copy-paste error from truncated logs)
    if (url) {
        url = url.trim().replace(/\.+$/, '');
    }

    return url;
};

export const getSettings = async (req: any, res: any) => {
    try {
        const settings = await ensureSettingsLoaded();
        
        // Create a copy to not mutate cache with computed properties
        const responseSettings = { ...settings };
        
        // Calculate effective URL to show in UI
        responseSettings.ollamaUrl = getEffectiveOllamaUrl(settings);
        
        res.status(200).json(responseSettings);
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
        
        // Update Cache Immediately
        cachedSettings = newSettings;
        
        // Persist to Disk
        await writeData(SETTINGS_FILE_PATH, newSettings);

        // Check if critical settings changed (Provider or API Key or URL)
        const providerChanged = updates.provider && updates.provider !== currentSettings.provider;
        const keyChanged = (newSettings.provider === 'gemini' && updates.apiKey !== currentSettings.apiKey) ||
                           (newSettings.provider === 'openrouter' && updates.openRouterApiKey !== currentSettings.openRouterApiKey);
        const urlChanged = newSettings.provider === 'ollama' && updates.ollamaUrl !== currentSettings.ollamaUrl;

        if (providerChanged || keyChanged || urlChanged) {
            try {
                // Fetch models based on the NEW provider and NEW key/url
                const activeKey = newSettings.provider === 'openrouter' ? newSettings.openRouterApiKey : newSettings.apiKey;
                
                // If switching providers, we check if configuration is roughly valid to try a fetch
                let shouldFetch = false;
                if (newSettings.provider === 'gemini' && activeKey) shouldFetch = true;
                if (newSettings.provider === 'openrouter' && activeKey) shouldFetch = true;
                if (newSettings.provider === 'ollama') shouldFetch = true; // Always try fetch for Ollama as URL might be default/env

                if (shouldFetch) {
                    const { chatModels, imageModels, videoModels, ttsModels } = await listAvailableModels(activeKey, true);
                    res.status(200).json({ ...newSettings, models: chatModels, imageModels, videoModels, ttsModels });
                    return;
                }
            } catch (error) {
                // If fetching models fails, just return settings
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
        // Ollama doesn't need an API key usually, but function signature expects one
        return settings.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
    } catch (error) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
};

export const getSuggestionApiKey = async (): Promise<string | undefined> => {
    try {
        const settings = await ensureSettingsLoaded();
        return settings.suggestionApiKey || process.env.SUGGESTION_API_KEY;
    } catch (error) {
        return process.env.SUGGESTION_API_KEY;
    }
};

export const getProvider = async (): Promise<'gemini' | 'openrouter' | 'ollama'> => {
    try {
        const settings = await ensureSettingsLoaded();
        return settings.provider || 'gemini';
    } catch (error) {
        return 'gemini';
    }
}
