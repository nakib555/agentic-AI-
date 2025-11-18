/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Changed type-only import to regular import to resolve type errors.
import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const DATA_PATH = path.join(process.cwd(), 'data');
const MEMORY_PATH = path.join(DATA_PATH, 'memory.json');

const ensureDataDir = async () => {
    try {
        await fs.mkdir(DATA_PATH, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            console.error('Failed to create data directory:', error);
            throw error;
        }
    }
};

const readMemory = async (): Promise<{ content: string }> => {
    try {
        const fileContent = await fs.readFile(MEMORY_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await ensureDataDir();
            // File doesn't exist, create it with empty content
            const initialMemory = { content: '' };
            await fs.writeFile(MEMORY_PATH, JSON.stringify(initialMemory, null, 2), 'utf-8');
            return initialMemory;
        }
        console.error('Failed to read memory file:', error);
        return { content: '' };
    }
};

export const getMemory = async (req: Request, res: Response) => {
    try {
        const memory = await readMemory();
        res.status(200).json(memory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve memory.' });
    }
};

export const updateMemory = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Invalid memory content provided.' });
        }
        const memoryData = { content };
        await fs.writeFile(MEMORY_PATH, JSON.stringify(memoryData, null, 2), 'utf-8');
        res.status(200).json(memoryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update memory.' });
    }
};

export const clearMemory = async (req: Request, res: Response) => {
    try {
        const initialMemory = { content: '' };
        await fs.writeFile(MEMORY_PATH, JSON.stringify(initialMemory, null, 2), 'utf-8');
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear memory.' });
    }
};
