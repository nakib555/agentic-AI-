/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { getApiKey } from './settingsHandler.js';
import { validModels, validImageModels, validVideoModels } from './models.js';

export const getAvailableModelsHandler = async (req: Request, res: Response) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        return res.status(200).json({ models: [], imageModels: [], videoModels: [] });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        // A simple, low-cost call to verify the key.
        await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: ' ' });
        
        // If the call succeeds, the key is valid. Return the hardcoded model lists.
        res.status(200).json({
            models: validModels,
            imageModels: validImageModels,
            videoModels: validVideoModels,
        });
    } catch (error: any) {
        console.warn('API Key validation failed while fetching models:', error.message);
        // If the key is invalid, return empty arrays.
        res.status(200).json({ models: [], imageModels: [], videoModels: [] });
    }
};
