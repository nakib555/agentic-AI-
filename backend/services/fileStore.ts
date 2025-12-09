
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { Buffer } from 'buffer';
import { ToolError } from '../utils/apiError.js';
import { historyControl } from './historyControl.js';
import { getFs } from '../utils/platform.js';

// In-memory store for Cloudflare
const memoryFileStore = new Map<string, Buffer | string>();

const ensureDir = async (dirPath: string) => {
    const fs = await getFs();
    if (!fs) return;
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory ${dirPath}:`, error);
        }
    }
};

const resolveChatFilePath = async (chatId: string, virtualPath: string): Promise<string> => {
    const chatFolder = await historyControl.getChatFolderPath(chatId);
    if (!chatFolder) {
        throw new ToolError('fileStore', 'CHAT_NOT_FOUND', `Chat session ${chatId} does not exist.`);
    }
    
    const fileDir = path.join(chatFolder, 'file');
    const safeVirtualPath = path.normalize(virtualPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const finalPath = path.join(fileDir, safeVirtualPath);

    if (!finalPath.startsWith(fileDir)) {
        throw new ToolError('fileStore', 'PATH_TRAVERSAL', 'Access denied: Path is outside the allowed directory.');
    }
    
    return finalPath;
};

export const fileStore = {
    async saveFile(chatId: string, virtualPath: string, data: Buffer | string): Promise<void> {
        const fs = await getFs();
        if (fs) {
            const realPath = await resolveChatFilePath(chatId, virtualPath);
            const dir = path.dirname(realPath);
            await ensureDir(dir);
            await fs.writeFile(realPath, data);
            console.log(`[FileStore] Saved file for chat ${chatId} to: ${realPath}`);
        } else {
            // Edge fallback
            const key = `${chatId}:${virtualPath}`;
            memoryFileStore.set(key, data);
        }
    },

    async getFile(chatId: string, virtualPath: string): Promise<Buffer | null> {
        const fs = await getFs();
        if (fs) {
            try {
                const realPath = await resolveChatFilePath(chatId, virtualPath);
                return await fs.readFile(realPath);
            } catch (error: any) {
                if (error.code === 'ENOENT') return null;
                throw error;
            }
        } else {
            const key = `${chatId}:${virtualPath}`;
            const data = memoryFileStore.get(key);
            if (data === undefined) return null;
            return typeof data === 'string' ? Buffer.from(data) : data;
        }
    },

    async listFiles(chatId: string, virtualPath: string): Promise<string[]> {
        const fs = await getFs();
        if (fs) {
            try {
                const realPath = await resolveChatFilePath(chatId, virtualPath);
                try {
                    await fs.access(realPath);
                } catch {
                    return [];
                }
                const entries = await fs.readdir(realPath, { withFileTypes: true });
                return entries.map(entry => entry.name + (entry.isDirectory() ? '/' : ''));
            } catch (error: any) {
                if (error.code === 'ENOENT') return [];
                throw error;
            }
        } else {
            // Very basic list implementation for memory store (flat)
            const prefix = `${chatId}:`;
            const keys = Array.from(memoryFileStore.keys()).filter(k => k.startsWith(prefix));
            return keys.map(k => k.replace(prefix, ''));
        }
    },

    async deleteFile(chatId: string, virtualPath: string): Promise<void> {
        const fs = await getFs();
        if (fs) {
            try {
                const realPath = await resolveChatFilePath(chatId, virtualPath);
                await fs.unlink(realPath);
            } catch (error: any) {
                if (error.code !== 'ENOENT') throw error;
            }
        } else {
            const key = `${chatId}:${virtualPath}`;
            memoryFileStore.delete(key);
        }
    },
    
    async getPublicUrl(chatId: string, virtualPath: string): Promise<string> {
        const baseUrl = await historyControl.getPublicUrlBase(chatId);
        if (!baseUrl) {
             throw new ToolError('fileStore', 'CHAT_NOT_FOUND', `Chat session ${chatId} does not exist.`);
        }
        const normalized = path.normalize(virtualPath).replace(/\\/g, '/');
        return `${baseUrl}/${normalized}`;
    }
};
