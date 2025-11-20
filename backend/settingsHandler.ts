
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
    isAutoPlayEnabled: false,
    isAgentMode: true,
};

const VALIDATION_TIMEOUT_MS = 10000; // 10 seconds timeout for validation

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

    // Fallback: Check Environment Variables for API Key
    if (!settings.apiKey) {
        settings.apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    }

    // 2. Read Prompts from Text Files (These override JSON if present)
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
        // We verify whenever apiKey is present to ensure models are fetched and the key is valid.
        if (req.body.apiKey) {
            try {
                // Trim the API key to prevent issues with whitespace
                const cleanKey = req.body.apiKey.trim();
                newSettings.apiKey = cleanKey;
                
                const ai = new GoogleGenAI({ apiKey: cleanKey });
                
                // Verification Step with Timeout
                // We make a lightweight call to ensure the key is valid and active.
                await withTimeout(
                    ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ parts: [{ text: ' ' }] }] }),
                    VALIDATION_TIMEOUT_MS,
                    'API Key validation timed out. Please try again.'
                );
                
                // Model Fetch Step with Timeout
                // We try to fetch the models, but we also protect against this hanging.
                const fetchedModels = await withTimeout(
                     listAvailableModels(cleanKey),
                     VALIDATION_TIMEOUT_MS,
                     'Fetching models timed out.'
                );

                // Map chatModels to models to match the frontend expectation (same as modelsHandler)
                modelData = {
                    models: fetchedModels.chatModels,
                    imageModels: fetchedModels.imageModels,
                    videoModels: fetchedModels.videoModels
                };
                
            } catch (error: any) {
                console.warn('API Key validation failed on save:', error.message);
                
                const parsedError = parseApiError(error);
                
                let status = 400; // Default to Bad Request for validation failures
                if (parsedError.code === 'INVALID_API_KEY') status = 401;
                else if (parsedError.code === 'RATE_LIMIT_EXCEEDED') status = 429;
                else if (parsedError.code === 'UNAVAILABLE') status = 503;
                
                return res.status(status).json({ error: parsedError.message });
            }
        }

        // Save the main settings JSON. 
        // Note: We include the prompts here too for redundancy/backwards compatibility, 
        // but the text files are the source of truth on read.
        // IMPORTANT: Don't save the env var fallback back to the file if it wasn't explicitly set in the request
        // We want the file to remain "clean" if possible, but `newSettings` merges current (which includes read env var) with body.
        // This is actually fine; saving it to the file persists it for future restarts if env var is removed.
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
