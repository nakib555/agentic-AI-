
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';

// --- Centralized Path Definitions ---
// Check environment
const isNode = typeof process !== 'undefined' && (process as any).cwd;
const ROOT_DIR = isNode ? (process as any).cwd() : '/tmp'; // Fallback for edge
const DATA_PATH = (isNode && process.env.DATA_DIR) || path.join(ROOT_DIR, 'data');

export const HISTORY_PATH = path.join(DATA_PATH, 'history');
export const SETTINGS_DIR = path.join(DATA_PATH, 'settings');
export const SETTINGS_FILE_PATH = path.join(SETTINGS_DIR, 'settings.json');
export const MEMORY_DIR = path.join(SETTINGS_DIR, 'memory');
export const MEMORY_CONTENT_PATH = path.join(MEMORY_DIR, 'core.txt');
export const MEMORY_FILES_DIR = path.join(MEMORY_DIR, 'files');
export const PROMPTS_DIR = path.join(SETTINGS_DIR, 'prompts');
export const ABOUT_USER_FILE = path.join(PROMPTS_DIR, 'about_user.txt');
export const ABOUT_RESPONSE_FILE = path.join(PROMPTS_DIR, 'about_response.txt');
export const HISTORY_INDEX_PATH = path.join(HISTORY_PATH, 'history.json');
export const TIME_GROUPS_PATH = path.join(HISTORY_PATH, 'timeGroups.json');

const ensureDir = async (dirPath: string) => {
    if (!isNode) return;
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') console.error(`Error creating directory ${dirPath}:`, error);
    }
};

export const initDataStore = async () => {
    if (!isNode) {
        console.log('[DATA_STORE] Running in non-Node environment (Cloudflare). Persistence limited to runtime memory unless KV is bound.');
        return;
    }

    console.log(`[DATA_STORE] Initializing data store at path: ${DATA_PATH}`);
    
    await ensureDir(DATA_PATH);
    await ensureDir(HISTORY_PATH);
    await ensureDir(SETTINGS_DIR);
    await ensureDir(MEMORY_DIR);
    await ensureDir(MEMORY_FILES_DIR);
    await ensureDir(PROMPTS_DIR);
    
    const initJsonFile = async (filePath: string, defaultValue: any) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (!content.trim()) throw new Error('Empty file');
            JSON.parse(content);
        } catch (error) {
            console.log(`[DATA_STORE] Initializing default file: ${path.basename(filePath)}`);
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
        }
    };

    await initJsonFile(HISTORY_INDEX_PATH, []);
    await initJsonFile(TIME_GROUPS_PATH, { 'Today': [], 'Yesterday': [], 'Previous 7 Days': [] });
    
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
    await initJsonFile(SETTINGS_FILE_PATH, defaultSettings);
    
    try { await fs.access(MEMORY_CONTENT_PATH); } catch { await fs.writeFile(MEMORY_CONTENT_PATH, '', 'utf-8'); }
    try { await fs.access(ABOUT_USER_FILE); } catch { await fs.writeFile(ABOUT_USER_FILE, '', 'utf-8'); }
    try { await fs.access(ABOUT_RESPONSE_FILE); } catch { await fs.writeFile(ABOUT_RESPONSE_FILE, '', 'utf-8'); }

    console.log('[DATA_STORE] Data initialization complete.');
};
