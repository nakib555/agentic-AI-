
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { MEMORY_PATH } from './data-store.js';

const readMemory = async (): Promise<{ content: string, files: any[] }> => {
    try {
        const fileContent = await fs.readFile(MEMORY_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        // Ensure structure exists
        return { 
            content: data.content || '', 
            files: Array.isArray(data.files) ? data.files : [] 
        };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create it with empty content
            const initialMemory = { content: '', files: [] };
            await fs.writeFile(MEMORY_PATH, JSON.stringify(initialMemory, null, 2), 'utf-8');
            return initialMemory;
        }
        console.error('Failed to read memory file:', error);
        return { content: '', files: [] };
    }
};

export const getMemory = async (req: any, res: any) => {
    try {
        const memory = await readMemory();
        res.status(200).json(memory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve memory.' });
    }
};

export const updateMemory = async (req: any, res: any) => {
    try {
        const { content, files } = req.body;
        
        // Read existing to merge if partial updates (though usually we send full state)
        const current = await readMemory();
        
        const memoryData = {
            content: content !== undefined ? content : current.content,
            files: files !== undefined ? files : current.files
        };
        
        await fs.writeFile(MEMORY_PATH, JSON.stringify(memoryData, null, 2), 'utf-8');
        res.status(200).json(memoryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update memory.' });
    }
};

export const clearMemory = async (req: any, res: any) => {
    try {
        const initialMemory = { content: '', files: [] };
        await fs.writeFile(MEMORY_PATH, JSON.stringify(initialMemory, null, 2), 'utf-8');
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear memory.' });
    }
};
