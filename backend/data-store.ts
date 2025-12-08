
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';

// --- Centralized Path Definitions ---
// Use process.cwd() to create 'data' folder in the project root
const ROOT_DIR = (process as any).cwd();
const DATA_PATH = path.join(ROOT_DIR, 'data');

export const HISTORY_PATH = path.join(DATA_PATH, 'history');

// Settings Structure: data/settings/
export const SETTINGS_DIR = path.join(DATA_PATH, 'settings');
export const SETTINGS_FILE_PATH = path.join(SETTINGS_DIR, 'settings.json');

// Memory Structure: data/settings/memory/
export const MEMORY_DIR = path.join(SETTINGS_DIR, 'memory');
export const MEMORY_CONTENT_PATH = path.join(MEMORY_DIR, 'core.txt');
export const MEMORY_FILES_DIR = path.join(MEMORY_DIR, 'files');

// Prompts Structure: data/settings/prompts/
export const PROMPTS_DIR = path.join(SETTINGS_DIR, 'prompts');
export const ABOUT_USER_FILE = path.join(PROMPTS_DIR, 'about_user.txt');
export const ABOUT_RESPONSE_FILE = path.join(PROMPTS_DIR, 'about_response.txt');

// Centralized Indices
export const HISTORY_INDEX_PATH = path.join(HISTORY_PATH, 'history.json');
export const TIME_GROUPS_PATH = path.join(HISTORY_PATH, 'timeGroups.json');

// --- Initialization Logic ---
const ensureDir = async (dirPath: string) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory ${dirPath}:`, error);
            throw error;
        }
    }
};

export const initDataStore = async () => {
    console.log(`[DATA_STORE] Initializing data store at absolute path: ${DATA_PATH}`);
    
    // 1. Create Directory Structure
    await ensureDir(DATA_PATH);
    await ensureDir(HISTORY_PATH);
    await ensureDir(SETTINGS_DIR);
    
    // Explicitly create nested memory folders inside settings
    await ensureDir(MEMORY_DIR);
    await ensureDir(MEMORY_FILES_DIR);
    
    // Create prompts folder inside settings
    await ensureDir(PROMPTS_DIR);
    
    // Helper to initialize or validate JSON file
    const initJsonFile = async (filePath: string, defaultValue: any) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Check if empty or invalid JSON
            if (!content.trim()) {
                 throw new Error('Empty file');
            }
            JSON.parse(content);
        } catch (error) {
            // If file doesn't exist, is empty, or invalid JSON, write default
            console.log(`[DATA_STORE] Initializing default file: ${path.basename(filePath)}`);
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
        }
    };

    // Initialize History Indices
    await initJsonFile(HISTORY_INDEX_PATH, []);
    await initJsonFile(TIME_GROUPS_PATH, { 'Today': [], 'Yesterday': [], 'Previous 7 Days': [] });
    
    // Initialize Settings
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
        isAutoPlayEnabled: false,
        isAgentMode: true,
    };
    await initJsonFile(SETTINGS_FILE_PATH, defaultSettings);
    
    // Initialize Core Memory File if missing
    try {
        await fs.access(MEMORY_CONTENT_PATH);
    } catch {
        console.log('[DATA_STORE] Initializing core memory file');
        await fs.writeFile(MEMORY_CONTENT_PATH, '', 'utf-8');
    }

    // Initialize Prompt Files if missing
    try {
        await fs.access(ABOUT_USER_FILE);
    } catch {
        await fs.writeFile(ABOUT_USER_FILE, '', 'utf-8');
    }

    try {
        await fs.access(ABOUT_RESPONSE_FILE);
    } catch {
        await fs.writeFile(ABOUT_RESPONSE_FILE, '', 'utf-8');
    }

    console.log('[DATA_STORE] Data initialization complete.');
};
