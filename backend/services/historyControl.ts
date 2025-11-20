
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { HISTORY_PATH, HISTORY_INDEX_PATH, TIME_GROUPS_PATH } from '../data-store.js';
import type { ChatSession } from '../../src/types';

// Minimal metadata stored in the master index for fast listing
type ChatIndexEntry = {
    id: string;
    title: string;
    folderName: string;
    createdAt: number;
    updatedAt: number;
    model: string;
};

// Full conversation structure stored inside the chat folder
type ChatDataFile = ChatSession & {
    pagination?: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
    };
    version: number;
};

class HistoryControlService {
    private indexCache: ChatIndexEntry[] | null = null;

    // --- Index Management ---

    private async loadIndex(): Promise<ChatIndexEntry[]> {
        if (this.indexCache) return this.indexCache;
        try {
            const data = await fs.readFile(HISTORY_INDEX_PATH, 'utf-8');
            this.indexCache = JSON.parse(data);
            return this.indexCache!;
        } catch (error) {
            return [];
        }
    }

    private async saveIndex(index: ChatIndexEntry[]) {
        this.indexCache = index;
        
        // Check and ensure directory exists to prevent crash if folder is deleted manually
        try {
            await fs.mkdir(HISTORY_PATH, { recursive: true });
        } catch (error: any) {
            if (error.code !== 'EEXIST') console.error("Failed to ensure history directory:", error);
        }

        await fs.writeFile(HISTORY_INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
        await this.updateTimeGroups(index);
    }

    private sanitizeTitle(title: string): string {
        // Improved to support Unicode characters for international titles
        // while maintaining filesystem safety.
        // Allows letters (unicode), numbers, spaces, dashes, underscores.
        return title
            .replace(/[^\p{L}\p{N}\s\-_]/gu, '') 
            .trim()
            .replace(/\s+/g, '-')      // Space to dash
            .replace(/-+/g, '-')       // Collapse dashes
            .substring(0, 64)          // Reasonable limit
            || 'Untitled';
    }

    private getFolderName(title: string, id: string): string {
        const safeTitle = this.sanitizeTitle(title);
        // Suffix with ID to ensure uniqueness and persistence even if titles collide
        return `${safeTitle}-${id.substring(0, 8)}`;
    }

    private async updateTimeGroups(index: ChatIndexEntry[]) {
        const groups: Record<string, ChatIndexEntry[]> = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 86400000;
        const weekStart = todayStart - (86400000 * 7);

        for (const entry of index) {
            if (entry.updatedAt >= todayStart) {
                groups['Today'].push(entry);
            } else if (entry.updatedAt >= yesterdayStart) {
                groups['Yesterday'].push(entry);
            } else if (entry.updatedAt >= weekStart) {
                groups['Previous 7 Days'].push(entry);
            } else {
                // Group older items by Month Year
                const date = new Date(entry.updatedAt);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!groups[monthYear]) groups[monthYear] = [];
                groups[monthYear].push(entry);
            }
        }
        
        // Remove empty default groups if not used (except maybe Today)
        if (groups['Older'].length === 0) delete groups['Older'];

        // Check and ensure directory exists
        try {
            await fs.mkdir(HISTORY_PATH, { recursive: true });
        } catch (error: any) {
             if (error.code !== 'EEXIST') console.error("Failed to ensure history directory:", error);
        }

        await fs.writeFile(TIME_GROUPS_PATH, JSON.stringify(groups, null, 2), 'utf-8');
    }

    // --- CRUD Operations ---

    async createChat(session: ChatSession): Promise<ChatSession> {
        const folderName = this.getFolderName(session.title, session.id);
        const chatFolderPath = path.join(HISTORY_PATH, folderName);
        const chatSubDir = path.join(chatFolderPath, 'chat');
        const fileSubDir = path.join(chatFolderPath, 'file');

        // 1. Create Directory Structure
        await fs.mkdir(chatFolderPath, { recursive: true });
        await fs.mkdir(chatSubDir, { recursive: true });
        await fs.mkdir(fileSubDir, { recursive: true });

        // 2. Save Conversation Data (conversation.json inside chat/)
        const chatData: ChatDataFile = {
            ...session,
            version: 1,
            pagination: { currentPage: 1, totalPages: 1, pageSize: 100 }
        };
        await fs.writeFile(
            path.join(chatSubDir, 'conversation.json'), 
            JSON.stringify(chatData, null, 2), 
            'utf-8'
        );

        // 3. Update Index
        const index = await this.loadIndex();
        const entry: ChatIndexEntry = {
            id: session.id,
            title: session.title,
            folderName: folderName,
            createdAt: session.createdAt,
            updatedAt: Date.now(),
            model: session.model
        };
        index.unshift(entry); // Add to top
        await this.saveIndex(index);

        return session;
    }

    async getChat(id: string): Promise<ChatSession | null> {
        const index = await this.loadIndex();
        const entry = index.find(e => e.id === id);
        if (!entry) return null;

        const filePath = path.join(HISTORY_PATH, entry.folderName, 'chat', 'conversation.json');
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as ChatSession;
        } catch (error) {
            console.error(`[HistoryControl] Failed to read chat ${id}:`, error);
            return null;
        }
    }

    async updateChat(id: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
        const index = await this.loadIndex();
        const entryIndex = index.findIndex(e => e.id === id);
        if (entryIndex === -1) return null;

        const entry = index[entryIndex];
        const originalFolderPath = path.join(HISTORY_PATH, entry.folderName);
        
        // Read current data
        const currentChat = await this.getChat(id);
        if (!currentChat) return null;

        const updatedChat: ChatDataFile = {
            ...currentChat,
            ...updates,
            version: 1 // Ensure version is preserved or incremented
        };
        let newFolderName = entry.folderName;

        // Handle Renaming (Title Change) - Rename the folder dynamically
        if (updates.title && updates.title !== entry.title) {
            newFolderName = this.getFolderName(updates.title, id);
            const newFolderPath = path.join(HISTORY_PATH, newFolderName);

            if (newFolderName !== entry.folderName) {
                try {
                    // Check for collision
                    try {
                        await fs.access(newFolderPath);
                        // If exists (rare), keep old folder or append timestamp?
                        // Appending timestamp to ensure uniqueness
                        newFolderName = `${newFolderName}-${Date.now()}`;
                        // Re-calculate path
                        await fs.rename(originalFolderPath, path.join(HISTORY_PATH, newFolderName));
                    } catch {
                        // Destination does not exist, safe to rename
                        await fs.rename(originalFolderPath, newFolderPath);
                    }

                    entry.folderName = newFolderName;
                } catch (error) {
                    console.error(`[HistoryControl] Failed to rename folder for chat ${id}:`, error);
                    // Fallback: keep old folder name if rename fails
                    newFolderName = entry.folderName; 
                }
            }
            // Always update index title if requested
            entry.title = updates.title;
        }

        // Update File content in the (potentially new) location
        const chatSubDir = path.join(HISTORY_PATH, newFolderName, 'chat');
        
        // Ensure directory exists (in case of manual deletion or corruption)
        await fs.mkdir(chatSubDir, { recursive: true });
        
        await fs.writeFile(
            path.join(chatSubDir, 'conversation.json'),
            JSON.stringify(updatedChat, null, 2),
            'utf-8'
        );

        // Update Index metadata
        entry.updatedAt = Date.now();
        if (updates.model) entry.model = updates.model;
        
        // Move updated entry to top (Recency)
        index.splice(entryIndex, 1);
        index.unshift(entry);
        
        await this.saveIndex(index);
        return updatedChat;
    }

    async deleteChat(id: string): Promise<void> {
        const index = await this.loadIndex();
        const entryIndex = index.findIndex(e => e.id === id);
        if (entryIndex === -1) return;

        const entry = index[entryIndex];
        const folderPath = path.join(HISTORY_PATH, entry.folderName);

        try {
            await fs.rm(folderPath, { recursive: true, force: true });
        } catch (error) {
            console.error(`[HistoryControl] Failed to delete folder ${folderPath}:`, error);
        }

        index.splice(entryIndex, 1);
        await this.saveIndex(index);
    }

    async deleteAllChats(): Promise<void> {
        // 1. Clear In-Memory Cache
        this.indexCache = [];

        // 2. Physically Wipe the History Directory
        try {
            // Check if directory exists first
            try {
                await fs.access(HISTORY_PATH);
            } catch {
                // Directory doesn't exist, nothing to delete.
                // Re-initialize empty index and return.
                await this.saveIndex([]);
                return;
            }

            const entries = await fs.readdir(HISTORY_PATH);
            for (const entry of entries) {
                const fullPath = path.join(HISTORY_PATH, entry);
                // Forcefully remove everything in the history path
                await fs.rm(fullPath, { recursive: true, force: true });
            }
        } catch (error) {
            console.error("[HistoryControl] Failed to wipe history directory:", error);
            throw error;
        }

        // 3. Re-initialize empty Index and TimeGroups files
        await this.saveIndex([]);
    }

    async getHistoryList(): Promise<Omit<ChatSession, 'messages'>[]> {
        const index = await this.loadIndex();
        // Return the cached index list. Messages are not loaded here for performance.
        return index.map(e => ({
            id: e.id,
            title: e.title,
            createdAt: e.createdAt,
            model: e.model,
            messages: [] 
        }));
    }

    // --- Public Path Resolvers for other services ---
    
    async getChatFolderPath(id: string): Promise<string | null> {
        const index = await this.loadIndex();
        const entry = index.find(e => e.id === id);
        if (!entry) return null;
        return path.join(HISTORY_PATH, entry.folderName);
    }
    
    async getPublicUrlBase(id: string): Promise<string | null> {
        const index = await this.loadIndex();
        const entry = index.find(e => e.id === id);
        if (!entry) return null;
        // Returns the URL segment for the frontend to access files
        return `/uploads/${entry.folderName}/file`;
    }
}

export const historyControl = new HistoryControlService();