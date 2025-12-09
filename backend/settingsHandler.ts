
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'hono';
import { parseApiError } from './utils/apiError.js';
import { 
    SETTINGS_FILE_PATH, 
    ABOUT_USER_FILE, 
    ABOUT_RESPONSE_FILE,
    PROMPTS_DIR
} from './data-store.js';
import { listAvailableModels } from './services/modelService.js';
import { getFs } from './utils/platform.js';

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

let memorySettings = { ...defaultSettings };
const verificationThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 2000;

// Helper to handle reading settings safely in different runtimes
const readSettings = async (c?: Context) => {
    let settings = { ...defaultSettings };
    const fs = await getFs();

    // 1. Try to load from disk if Node
    if (fs) {
        try {
            const content = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
            settings = { ...settings, ...JSON.parse(content) };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2), 'utf-8').catch(() => {});
            }
        }
        
        try {
            settings.aboutUser = await fs.readFile(ABOUT_USER_FILE, 'utf-8').catch(() => settings.aboutUser);
            settings.aboutResponse = await fs.readFile(ABOUT_RESPONSE_FILE, 'utf-8').catch(() => settings.aboutResponse);
        } catch {}
    } else {
        // 2. Fallback to in-memory for Edge
        settings = { ...settings, ...memorySettings };
    }

    // 3. Environment Variable Override (Node process.env OR Cloudflare c.env)
    let envKey: string | undefined;
    if (typeof process !== 'undefined') {
        envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
    if (c && c.env) {
        // @ts-ignore
        envKey = c.env.API_KEY || c.env.GEMINI_API_KEY;
    }

    if (envKey && (!settings.apiKey || settings.apiKey.trim() === '')) {
        settings.apiKey = envKey;
    }

    return settings;
};

export const getSettings = async (c: Context) => {
    try {
        const settings = await readSettings(c);
        return c.json(settings);
    } catch (error) {
        return c.json({ error: 'Failed to retrieve settings.' }, 500);
    }
};

export const updateSettings = async (c: Context) => {
    try {
        const body = await c.req.json();
        const fs = await getFs();
        
        if (fs) {
            await fs.mkdir(PROMPTS_DIR, { recursive: true }).catch(() => {});
        }

        const currentSettings = await readSettings(c);
        const newSettings = { ...currentSettings, ...body };
        let modelData: any = null;

        if (fs) {
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

        if (fs) {
            await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');
        } else {
            memorySettings = newSettings; // Update in-memory
        }
        
        return c.json({ ...newSettings, ...modelData });
    } catch (error) {
        return c.json({ error: 'Failed to save settings.' }, 500);
    }
};

export const getApiKey = async (c?: Context): Promise<string | null> => {
    const settings = await readSettings(c);
    return settings.apiKey || null;
};
