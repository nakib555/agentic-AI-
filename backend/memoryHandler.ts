
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Context } from 'hono';
import { MEMORY_CONTENT_PATH, MEMORY_FILES_DIR } from './data-store.js';

const isNode = typeof process !== 'undefined';

const generateFilename = (title: string, id: string) => {
    const safeTitle = title.replace(/[^a-z0-9\-_ ]/gi, '_').trim().replace(/\s+/g, '-').substring(0, 50) || 'untitled';
    return `${safeTitle}-${id.substring(0, 6)}.json`;
};

const readMemory = async (): Promise<{ content: string, files: any[] }> => {
    if (!isNode) return { content: '', files: [] };
    
    try {
        let content = '';
        try { content = await fs.readFile(MEMORY_CONTENT_PATH, 'utf-8'); } catch {}

        let files: any[] = [];
        try {
            const dirEntries = await fs.readdir(MEMORY_FILES_DIR);
            for (const filename of dirEntries) {
                if (filename.endsWith('.json')) {
                    const filePath = path.join(MEMORY_FILES_DIR, filename);
                    try {
                        const fileData = await fs.readFile(filePath, 'utf-8');
                        files.push(JSON.parse(fileData));
                    } catch {}
                }
            }
        } catch {}

        return { content, files };
    } catch {
        return { content: '', files: [] };
    }
};

export const getMemory = async (c: Context) => {
    const memory = await readMemory();
    return c.json(memory);
};

export const updateMemory = async (c: Context) => {
    if (!isNode) return c.json({ error: "Not supported in this environment" }, 501);

    try {
        const { content, files } = await c.req.json();
        
        if (content !== undefined) await fs.writeFile(MEMORY_CONTENT_PATH, content, 'utf-8');

        if (files !== undefined && Array.isArray(files)) {
            const existingEntries = await fs.readdir(MEMORY_FILES_DIR, { withFileTypes: true });
            const existingFileMap = new Map<string, string>();

            for (const entry of existingEntries) {
                if (entry.isFile() && entry.name.endsWith('.json')) {
                    try {
                        const filePath = path.join(MEMORY_FILES_DIR, entry.name);
                        const fileData = await fs.readFile(filePath, 'utf-8');
                        const json = JSON.parse(fileData);
                        if (json.id) existingFileMap.set(json.id, entry.name);
                    } catch {}
                }
            }

            const newIds = new Set(files.map((f: any) => f.id));

            for (const [id, filename] of existingFileMap) {
                if (!newIds.has(id)) await fs.unlink(path.join(MEMORY_FILES_DIR, filename));
            }

            for (const file of files) {
                const newFilename = generateFilename(file.title, file.id);
                const oldFilename = existingFileMap.get(file.id);
                if (oldFilename && oldFilename !== newFilename) {
                    try { await fs.unlink(path.join(MEMORY_FILES_DIR, oldFilename)); } catch {}
                }
                const filePath = path.join(MEMORY_FILES_DIR, newFilename);
                await fs.writeFile(filePath, JSON.stringify(file, null, 2), 'utf-8');
            }
        }
        
        const updatedMemory = await readMemory();
        return c.json(updatedMemory);
    } catch {
        return c.json({ error: 'Failed to update memory.' }, 500);
    }
};

export const clearMemory = async (c: Context) => {
    if (!isNode) return c.body(null, 204);
    
    try {
        await fs.writeFile(MEMORY_CONTENT_PATH, '', 'utf-8');
        const files = await fs.readdir(MEMORY_FILES_DIR);
        for (const file of files) {
            await fs.unlink(path.join(MEMORY_FILES_DIR, file));
        }
        return c.body(null, 204);
    } catch {
        return c.json({ error: 'Failed to clear memory.' }, 500);
    }
};
