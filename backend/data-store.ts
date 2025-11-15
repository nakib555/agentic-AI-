/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { Buffer } from 'buffer';
import type { ChatSession } from '../src/types';

const DATA_PATH = path.join(process.cwd(), 'data');
const CHATS_PATH = path.join(DATA_PATH, 'chats');
const UPLOADS_PATH = path.join(DATA_PATH, 'uploads');

const ensureDir = async (dirPath: string) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
    }
};

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
                await ensureDir(CHATS_PATH);
                return [];
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
        await ensureDir(CHATS_PATH);
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
        await fs.rm(CHATS_PATH, { recursive: true, force: true });
        await fs.rm(UPLOADS_PATH, { recursive: true, force: true });
        await Promise.all([ensureDir(CHATS_PATH), ensureDir(UPLOADS_PATH)]);
    },

    async saveFile(chatId: string, filename: string, data: Buffer | string): Promise<string> {
        const chatUploadsPath = path.join(UPLOADS_PATH, chatId);
        await ensureDir(chatUploadsPath);
        const filePath = path.join(chatUploadsPath, filename);
        await fs.writeFile(filePath, data);
        return `/uploads/${chatId}/${filename}`;
    },
};