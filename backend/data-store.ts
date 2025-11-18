/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import type { ChatSession } from '../src/types';

// --- Centralized Path Definitions ---
const DATA_PATH = process.env.VERCEL_ENV ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
export const CHATS_PATH = path.join(DATA_PATH, 'chats');
export const UPLOADS_PATH = path.join(DATA_PATH, 'uploads');
export const SETTINGS_PATH = path.join(DATA_PATH, 'settings.json');
export const MEMORY_PATH = path.join(DATA_PATH, 'memory.json');


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
    await ensureDir(CHATS_PATH);
    await ensureDir(UPLOADS_PATH);
    console.log('[DATA_STORE] Initialized and verified data directories.');
};


// --- Chat Data Store ---
export const dataStore = {
    async getChatHistoryList(): Promise<Omit<ChatSession, 'messages'>[]> {
        try {
            const files = await fs.readdir(CHATS_PATH);
            const chatPromises = files
                .filter(file => file.endsWith('.json'))
                .map(async (file) => {
                    const content = await fs.readFile(path.join(CHATS_PATH, file), 'utf-8');
                    const { id, title, createdAt, model } = JSON.parse(content);
                    return { id, title, createdAt, model };
                });
            const chats = await Promise.all(chatPromises);
            // Sort by creation date, newest first
            return chats.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return []; // Directory doesn't exist yet, which is fine on first run.
            }
            console.error('Failed to read chat history:', error);
            return [];
        }
    },

    async getChatSession(chatId: string): Promise<ChatSession | null> {
        try {
            const filePath = path.join(CHATS_PATH, `${chatId}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as ChatSession;
        } catch (error) {
            console.error(`Failed to read chat session ${chatId}:`, error);
            return null;
        }
    },

    async saveChatSession(chatSession: ChatSession): Promise<void> {
        const filePath = path.join(CHATS_PATH, `${chatSession.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(chatSession, null, 2), 'utf-8');
    },

    async deleteChatSession(chatId: string): Promise<void> {
        // Delete chat JSON file
        const chatFilePath = path.join(CHATS_PATH, `${chatId}.json`);
        try {
            await fs.unlink(chatFilePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to delete chat file ${chatFilePath}:`, error);
            }
        }

        // Delete associated uploads directory
        const uploadsDir = path.join(UPLOADS_PATH, chatId);
        try {
            await fs.rm(uploadsDir, { recursive: true, force: true });
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to delete uploads directory ${uploadsDir}:`, error);
            }
        }
    },

    async clearAllChatHistory(): Promise<void> {
        // Re-create the directories after deleting to ensure they exist.
        await fs.rm(CHATS_PATH, { recursive: true, force: true });
        await fs.rm(UPLOADS_PATH, { recursive: true, force: true });
        await Promise.all([ensureDir(CHATS_PATH), ensureDir(UPLOADS_PATH)]);
    },
};
