/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import type { Message } from '../../types';
import { getText } from '../../utils/geminiUtils';
import { parseApiError } from './apiError';

export const extractMemorySuggestions = async (conversation: Message[]): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const conversationTranscript = conversation
        .filter(msg => !msg.isHidden)
        .map(msg => `${msg.role}: ${msg.text.substring(0, 300)}`) // Truncate for efficiency
        .join('\n');
    
    const prompt = `
        Analyze the following conversation and identify key, long-term facts about the user or their preferences that should be remembered for future interactions.
        - Focus on facts like "I am a software engineer", "I prefer Python code", "My favorite topic is space exploration".
        - Do NOT extract temporary or conversational facts like "I'm looking for a coffee shop right now".
        - The output MUST be a valid JSON array of strings, with each string being a concise fact.
        - If no memorable facts are found, return an empty array [].

        ---
        CONVERSATION:
        ${conversationTranscript}
        ---
        JSON OUTPUT:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });

        const jsonText = getText(response).trim() || '[]';
        const suggestions = JSON.parse(jsonText);

        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];
    } catch (error) {
        console.error("Memory suggestion extraction failed:", parseApiError(error));
        return []; // Return empty array on error
    }
};

export const consolidateMemory = async (currentMemory: string, suggestions: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        You are a memory consolidation AI. Your task is to integrate new information into an existing memory summary, keeping it concise, organized, and deduplicated.

        RULES:
        - Combine new facts with existing ones.
        - Remove redundant information.
        - Maintain a neutral, factual tone.
        - The output should be a single block of text, with each fact on a new line.

        ---
        CURRENT MEMORY:
        ${currentMemory || "No existing memory."}
        ---
        NEW INFORMATION TO INTEGRATE:
        - ${suggestions.join('\n- ')}
        ---
        CONSOLIDATED MEMORY:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return getText(response).trim();
    } catch (error) {
        console.error("Memory consolidation failed:", parseApiError(error));
        // Fallback: append new suggestions to old memory if API fails
        return [currentMemory, ...suggestions].filter(Boolean).join('\n');
    }
};