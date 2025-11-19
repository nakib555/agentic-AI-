
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';

// --- Centralized Path Definitions ---
const DATA_PATH = path.join((process as any).cwd(), 'data');
export const HISTORY_PATH = path.join(DATA_PATH, 'history');
export const SETTINGS_PATH = path.join(DATA_PATH, 'settings.json');
export const MEMORY_PATH = path.join(DATA_PATH, 'memory.json');

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
    await ensureDir(DATA_PATH);
    await ensureDir(HISTORY_PATH);
    
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
            console.log(`[DATA_STORE] Initializing or resetting ${path.basename(filePath)}`);
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
        }
    };

    await initJsonFile(HISTORY_INDEX_PATH, []);
    await initJsonFile(TIME_GROUPS_PATH, {});
    
    // Also ensure settings and memory files exist or are valid
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
    await initJsonFile(SETTINGS_PATH, defaultSettings);
    await initJsonFile(MEMORY_PATH, { content: '' });

    console.log('[DATA_STORE] Initialized data directories and indices.');
};
