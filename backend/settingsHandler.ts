
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { Context } from 'hono';
import { parseApiError } from './utils/apiError.js';
import { 
    SETTINGS_FILE_PATH, 
    ABOUT_USER_FILE, 
    ABOUT_RESPONSE_FILE,
    PROMPTS_DIR
} from './data-store.js';
import { listAvailableModels } from './services/modelService.js';

// Environment safe helper
const getEnv = (key: string) => typeof process !== 'undefined' ? process.env[key] : undefined;

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
    ttsModel: 'gemini-2.5-flash-preview-tts',
    isAgentMode: true,
};

const verificationThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 2000;

// Helper to handle reading settings safely in different runtimes
const readSettings = async () => {
    let settings = { ...defaultSettings };

    try {
        if (typeof process !== 'undefined') {
            const content = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
            settings = { ...settings, ...JSON.parse(content) };
        }
    } catch (error: any) {
        if (typeof process !== 'undefined' && error.code === 'ENOENT') {
            await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2), 'utf-8').catch(() => {});
        }
    }

    const envKey = getEnv('API_KEY') || getEnv('GEMINI_API_KEY');
    if (envKey && (!settings.apiKey || settings.apiKey.trim() === '')) {
        settings.apiKey = envKey;
    }

    try {
        if (typeof process !== 'undefined') {
            settings.aboutUser = await fs.readFile(ABOUT_USER_FILE, 'utf-8').catch(() => settings.aboutUser);
            settings.aboutResponse = await fs.readFile(ABOUT_RESPONSE_FILE, 'utf-8').catch(() => settings.aboutResponse);
        }
    } catch {}

    return settings;
};

export const getSettings = async (c: Context) => {
    try {
        const settings = await readSettings();
        return c.json(settings);
    } catch (error) {
        return c.json({ error: 'Failed to retrieve settings.' }, 500);
    }
};

export const updateSettings = async (c: Context) => {
    try {
        const body = await c.req.json();
        
        if (typeof process !== 'undefined') {
            await fs.mkdir(PROMPTS_DIR, { recursive: true }).catch(() => {});
        }

        const currentSettings = await readSettings();
        const newSettings = { ...currentSettings, ...body };
        let modelData: any = null;

        if (typeof process !== 'undefined') {
            if (typeof body.aboutUser === 'string') await fs.writeFile(ABOUT_USER_FILE, body.aboutUser, 'utf-8');
            if (typeof body.aboutResponse === 'string') await fs.writeFile(ABOUT_RESPONSE_FILE, body.aboutResponse, 'utf-8');
        }

        if (body.apiKey) {
            try {
                const cleanKey = body.apiKey.trim();
                const keyHash = cleanKey.slice(-8);
                const lastAttempt = verificationThrottle.get(keyHash) || 0;
                const now = Date.now();
                
                if (now - lastAttempt < THROTTLE_WINDOW_MS) {
                    return c.json({ error: "Please wait a moment before verifying the API key again." }, 429);
                }
                verificationThrottle.set(keyHash, now);

                newSettings.apiKey = cleanKey;
                
                const fetchedModels = await listAvailableModels(cleanKey, true);
                modelData = {
                    models: fetchedModels.chatModels,
                    imageModels: fetchedModels.imageModels,
                    videoModels: fetchedModels.videoModels,
                    ttsModels: fetchedModels.ttsModels
                };
                
            } catch (error: any) {
                const parsedError = parseApiError(error);
                let status = 400; 
                if (parsedError.code === 'INVALID_API_KEY') status = 401;
                else if (parsedError.code === 'RATE_LIMIT_EXCEEDED') status = 429;
                else if (parsedError.code === 'UNAVAILABLE') status = 503;
                return c.json({ error: parsedError.message }, status as any);
            }
        }

        if (typeof process !== 'undefined') {
            await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');
        }
        return c.json({ ...newSettings, ...modelData });
    } catch (error) {
        return c.json({ error: 'Failed to save settings.' }, 500);
    }
};

export const getApiKey = async (): Promise<string | null> => {
    const settings = await readSettings();
    return settings.apiKey || null;
};
