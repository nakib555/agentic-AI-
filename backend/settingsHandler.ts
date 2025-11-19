
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { GoogleGenAI } from "@google/genai";
import { parseApiError } from './utils/apiError.js';
import { SETTINGS_PATH } from './data-store.js';
import { listAvailableModels } from './services/modelService.js';

// Default settings structure
const defaultSettings = {
    apiKey: '',
    aboutUser: '',
    aboutResponse: '',
    temperature: 0.7,
    maxTokens: 0,
    imageModel: 'imagen-4.0-generate-001',
    videoModel: 'veo-3.1-fast-generate-preview',
    isMemoryEnabled: false,
    ttsVoice: 'Kore',
    isAutoPlayEnabled: false,
    isAgentMode: true,
};

const readSettings = async () => {
    try {
        const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return { ...defaultSettings, ...JSON.parse(content) };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // The init script ensures the directory exists, but the file might not.
            // Create it with defaults if it doesn't.
            await fs.writeFile(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2), 'utf-8');
            return defaultSettings;
        }
        console.error('Failed to read settings:', error);
        return defaultSettings;
    }
};

export const getSettings = async (req: any, res: any) => {
    try {
        const settings = await readSettings();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Failed to get settings:', error);
        res.status(500).json({ error: 'Failed to retrieve settings.' });
    }
};

export const updateSettings = async (req: any, res: any) => {
    try {
        const currentSettings = await readSettings();
        const newSettings = { ...currentSettings, ...req.body };
        let modelData: any = null;

        // If a new API key is being provided and it's different, verify it.
        if (req.body.apiKey && req.body.apiKey !== currentSettings.apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey: req.body.apiKey });
                // Make a lightweight, free call to validate the key.
                await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ parts: [{ text: ' ' }] }] });
                // On success, fetch the available models to send back to the client.
                modelData = await listAvailableModels(req.body.apiKey);
            } catch (error: any) {
                console.warn('API Key validation failed on save:', error.message);
                
                // The error from the Gemini SDK is often descriptive enough for the user.
                // Let's extract and pass that directly.
                let errorMessage = 'Invalid API Key. Please check the key and try again.';
                
                // Example Gemini SDK error: "[GoogleGenerativeAI Error]: API key not valid. Please pass a valid API key."
                if (error.message && error.message.includes('[GoogleGenerativeAI Error]:')) {
                    errorMessage = error.message.split('[GoogleGenerativeAI Error]: ')[1];
                } else if (error.message) {
                    errorMessage = error.message;
                }

                return res.status(401).json({ error: errorMessage });
            }
        }

        await fs.writeFile(SETTINGS_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');
        res.status(200).json({ ...newSettings, ...modelData });
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to save settings.' });
    }
};

export const getApiKey = async (): Promise<string | null> => {
    const settings = await readSettings();
    return settings.apiKey || null;
};
