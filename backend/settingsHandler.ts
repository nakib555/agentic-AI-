
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { GoogleGenAI } from "@google/genai";
import { parseApiError } from './utils/apiError.js';
import { 
    SETTINGS_FILE_PATH, 
    ABOUT_USER_FILE, 
    ABOUT_RESPONSE_FILE,
    PROMPTS_DIR
} from './data-store.js';
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
    ttsModel: 'gemini-2.5-flash-preview-tts', // Add default
    isAgentMode: true,
};

// Rate limiting map: Key (last 8 chars) -> Timestamp
const verificationThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 2000; // 2 seconds between verifications for the same key

// Helper for timeout
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    let timer: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        timeoutPromise
    ]);
};

const readSettings = async () => {
    let settings = { ...defaultSettings };

    // 1. Read JSON Configuration
    try {
        const content = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
        settings = { ...settings, ...JSON.parse(content) };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2), 'utf-8');
        } else {
            console.error('Failed to read settings json:', error);
        }
    }

    // 2. Environment Variable Override
    // If the stored key is empty/missing, ALWAYS prefer the environment variable.
    const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (envKey && (!settings.apiKey || settings.apiKey.trim() === '')) {
        settings.apiKey = envKey;
    }

    // 3. Read Prompts from Text Files (These override JSON if present)
    try {
        const aboutUser = await fs.readFile(ABOUT_USER_FILE, 'utf-8');
        settings.aboutUser = aboutUser;
    } catch (e) {
        // File might not exist yet, rely on JSON or default
    }

    try {
        const aboutResponse = await fs.readFile(ABOUT_RESPONSE_FILE, 'utf-8');
        settings.aboutResponse = aboutResponse;
    } catch (e) {
        // File might not exist yet, rely on JSON or default
    }

    return settings;
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
        // Ensure prompts directory exists
        await fs.mkdir(PROMPTS_DIR, { recursive: true });

        const currentSettings = await readSettings();
        const newSettings = { ...currentSettings, ...req.body };
        let modelData: any = null;

        // Write Prompts to individual files if they are present in the request
        if (typeof req.body.aboutUser === 'string') {
            await fs.writeFile(ABOUT_USER_FILE, req.body.aboutUser, 'utf-8');
        }
        
        if (typeof req.body.aboutResponse === 'string') {
            await fs.writeFile(ABOUT_RESPONSE_FILE, req.body.aboutResponse, 'utf-8');
        }

        // If an API key is being provided, verify it.
        if (req.body.apiKey) {
            try {
                const cleanKey = req.body.apiKey.trim();
                
                // --- Rate Limiting ---
                const keyHash = cleanKey.slice(-8); // Simple check logic
                const lastAttempt = verificationThrottle.get(keyHash) || 0;
                const now = Date.now();
                
                if (now - lastAttempt < THROTTLE_WINDOW_MS) {
                    console.warn(`[SETTINGS] Rate limit exceeded for key verification.`);
                    return res.status(429).json({ error: "Please wait a moment before verifying the API key again." });
                }
                verificationThrottle.set(keyHash, now);

                newSettings.apiKey = cleanKey;
                
                console.log(`[SETTINGS] Verifying API key via model list fetch...`);

                // Verification Step: Try to fetch models.
                // We use `true` for forceRefresh to ensure the key is valid right now.
                const fetchedModels = await withTimeout(
                     listAvailableModels(cleanKey, true),
                     10000, // 10s timeout
                     'API Key verification timed out. The Google API might be slow or blocked.'
                );

                console.log(`[SETTINGS] API Key verified. Found ${fetchedModels.chatModels.length} chat models.`);

                // If successful, attach models to response so frontend updates immediately
                modelData = {
                    models: fetchedModels.chatModels,
                    imageModels: fetchedModels.imageModels,
                    videoModels: fetchedModels.videoModels,
                    ttsModels: fetchedModels.ttsModels // Add this
                };
                
            } catch (error: any) {
                console.warn('API Key verification failed:', error.message);
                
                const parsedError = parseApiError(error);
                
                let status = 400; 
                if (parsedError.code === 'INVALID_API_KEY' || error.message.includes('400')) status = 401;
                else if (parsedError.code === 'RATE_LIMIT_EXCEEDED') status = 429;
                else if (parsedError.code === 'UNAVAILABLE') status = 503;
                
                // Return error immediately, do not save invalid key (or client handles it)
                return res.status(status).json({ error: parsedError.message });
            }
        }

        // Only write to file if everything succeeded
        await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');
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
