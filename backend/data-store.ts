/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';

export const DATA_DIR = path.join((process as any).cwd(), 'data');
export const HISTORY_PATH = path.join(DATA_DIR, 'history');
export const HISTORY_INDEX_PATH = path.join(DATA_DIR, 'history-index.json');
export const TIME_GROUPS_PATH = path.join(DATA_DIR, 'time-groups.json');
export const SETTINGS_FILE_PATH = path.join(DATA_DIR, 'settings.json');
export const MEMORY_CONTENT_PATH = path.join(DATA_DIR, 'memory.txt');
export const MEMORY_FILES_DIR = path.join(DATA_DIR, 'memory_files');

export async function readData<T>(filePath: string): Promise<T> {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
}

export async function writeData(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initDataFile(filePath: string, defaultContent: any) {
    try {
        await fs.access(filePath);
    } catch {
        await writeData(filePath, defaultContent);
    }
}

export async function initDataStore() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(HISTORY_PATH, { recursive: true });
    await fs.mkdir(MEMORY_FILES_DIR, { recursive: true });

    await initDataFile(HISTORY_INDEX_PATH, []);
    await initDataFile(TIME_GROUPS_PATH, {});
    
    // Default settings
    // Note: Model fields are initialized as empty strings. 
    // The frontend application logic automatically selects the first available model 
    // from the dynamically fetched list if the setting is empty.
    const defaultSettings = {
        apiKey: '',
        suggestionApiKey: '', // Secondary key for background tasks
        aboutUser: '',
        aboutResponse: '',
        temperature: 0.7,
        maxTokens: 0,
        imageModel: '', // Dynamic
        videoModel: '', // Dynamic
        isMemoryEnabled: false,
        ttsVoice: 'Kore',
        ttsModel: '', // Dynamic
        isAgentMode: false,
        activeModel: '', // Add this
    };
    await initDataFile(SETTINGS_FILE_PATH, defaultSettings);
    
    // Initialize Core Memory File if missing
    try {
        await fs.access(MEMORY_CONTENT_PATH);
    } catch {
        await fs.writeFile(MEMORY_CONTENT_PATH, '', 'utf-8');
    }
}