/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { Buffer } from 'buffer';
import { ToolError } from '../utils/apiError';

const UPLOADS_PATH = path.join(process.cwd(), 'data', 'uploads');

const ensureDir = async (dirPath: string) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Ignore if it already exists, but log other errors
        // Fix: Replaced NodeJS.ErrnoException with a generic type assertion to resolve namespace error.
        if ((error as { code?: string }).code !== 'EEXIST') {
            console.error(`Error creating directory ${dirPath}:`, error);
        }
    }
};

// Ensure base uploads directory exists on startup
ensureDir(UPLOADS_PATH);

// Resolves a virtual path to a real, safe filesystem path within a chat's directory.
const resolveVirtualPath = (chatId: string, virtualPath: string): string => {
    // Sanitize chatId to prevent traversal
    const safeChatId = path.normalize(chatId).replace(/^(\.\.(\/|\\|$))+/, '');
    if (safeChatId.includes('/') || safeChatId.includes('\\')) {
        throw new ToolError('fileStore', 'INVALID_CHAT_ID', 'Invalid chatId provided.');
    }
    const chatDirectory = path.join(UPLOADS_PATH, safeChatId);

    // Sanitize and normalize the virtual path
    const normalizedVirtualPath = path.normalize(virtualPath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // The virtual FS root is the chat-specific directory
    const finalPath = path.join(chatDirectory, normalizedVirtualPath);

    // Security check: ensure the final path is still within the chat's directory
    if (!finalPath.startsWith(chatDirectory)) {
        throw new ToolError('fileStore', 'PATH_TRAVERSAL_ATTEMPT', 'Access denied: Path is outside the allowed directory.');
    }
    
    return finalPath;
};


export const fileStore = {
    async saveFile(chatId: string, virtualPath: string, data: Buffer | string): Promise<void> {
        const realPath = resolveVirtualPath(chatId, virtualPath);
        const dir = path.dirname(realPath);
        await ensureDir(dir);
        await fs.writeFile(realPath, data);
        console.log(`[FileStore] Saved file for chat ${chatId} to: ${realPath}`);
    },

    async getFile(chatId: string, virtualPath: string): Promise<Buffer | null> {
        const realPath = resolveVirtualPath(chatId, virtualPath);
        try {
            return await fs.readFile(realPath);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    },

    async listFiles(chatId: string, virtualPath: string): Promise<string[]> {
        const dirPath = resolveVirtualPath(chatId, virtualPath);
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries.map(entry => entry.name + (entry.isDirectory() ? '/' : ''));
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                await ensureDir(dirPath); // Create dir if it doesn't exist
                return []; 
            }
            throw error;
        }
    },

    async deleteFile(chatId: string, virtualPath: string): Promise<void> {
        const realPath = resolveVirtualPath(chatId, virtualPath);
        try {
            await fs.unlink(realPath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    },
};