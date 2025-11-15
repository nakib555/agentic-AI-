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
        console.error(`Error creating directory ${dirPath}:`, error);
    }
};

// Ensure base uploads directory exists on startup
ensureDir(UPLOADS_PATH);

const getSafeFilePath = (chatId: string, virtualPath: string): string => {
    if (!virtualPath.startsWith('/main/output/')) {
        throw new ToolError('fileStore', 'INVALID_PATH', 'File path is not valid. Files can only be accessed within the "/main/output/" directory.');
    }
    const filename = path.basename(virtualPath);
    const safeChatId = path.normalize(chatId).replace(/^(\.\.(\/|\\|$))+/, '');
    const safeFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
    
    if (safeFilename.includes('/') || safeFilename.includes('\\')) {
        throw new ToolError('fileStore', 'INVALID_FILENAME', 'Filename cannot contain path separators.');
    }

    return path.join(UPLOADS_PATH, safeChatId, safeFilename);
};

export const fileStore = {
    async saveFile(chatId: string, virtualPath: string, data: Buffer | string): Promise<void> {
        const filePath = getSafeFilePath(chatId, virtualPath);
        const dir = path.dirname(filePath);
        await ensureDir(dir);
        await fs.writeFile(filePath, data);
        console.log(`[FileStore] Saved file to: ${filePath}`);
    },

    async getFile(chatId: string, virtualPath: string): Promise<Buffer | null> {
        const filePath = getSafeFilePath(chatId, virtualPath);
        try {
            return await fs.readFile(filePath);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    },

    async listFiles(chatId: string, virtualPath: string): Promise<string[]> {
        // We only support listing the output directory
        const dirToList = path.join(UPLOADS_PATH, chatId);
        try {
            const files = await fs.readdir(dirToList);
            return files.map(file => `/main/output/${file}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return []; // Directory doesn't exist, so no files
            }
            throw error;
        }
    },

    async deleteFile(chatId: string, virtualPath: string): Promise<void> {
        const filePath = getSafeFilePath(chatId, virtualPath);
        try {
            await fs.unlink(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') { // Don't throw if file is already gone
                throw error;
            }
        }
    },
};