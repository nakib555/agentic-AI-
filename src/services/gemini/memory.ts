/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
// FIX: Correct the relative import path for types.
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
        You are an AI assistant that identifies key, long-term information from a conversation to be saved to a user's memory profile.

        RULES:
        - Analyze the transcript and extract ONLY facts, preferences, or details that would be useful for the AI to remember in FUTURE conversations (e.g., "User likes dogs," "User is a software developer in London," "User's project is named 'Apollo'").
        - Do NOT extract conversational fluff, temporary requests, or information that is only relevant to the current chat.
        - The output MUST be a JSON array of strings. Each string should be a concise, self-contained statement.
        - If no new, meaningful, long-term information is found, return an empty JSON array: [].
        - Each statement should be a complete sentence.

        EXAMPLE OUTPUT:
        [
            "The user's name is Alex.",
            "The user is planning a trip to Japan in December.",
            "The user prefers code examples in Python."
        ]

        ---
        CONVERSATION TRANSCRIPT:
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
        // A simple parse is okay here because we requested JSON output.
        const suggestions = JSON.parse(jsonText);

        // Validate the structure of the parsed result.
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return []; // Return empty if structure is invalid
    } catch (error) {
        console.error("Memory suggestion extraction failed:", parseApiError(error));
        return []; // Return empty on error
    }
};

export const consolidateMemory = async (currentMemory: string, newSuggestions: string[]): Promise<string> => {
    // If there are no new suggestions, no need to call the model.
    if (newSuggestions.length === 0) {
        return currentMemory;
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        You are a memory consolidation AI. Your task is to integrate a list of new memory points with an existing user memory summary, creating a new, concise, and updated summary.

        RULES:
        - The final output MUST be a list of bullet points.
        - Synthesize and merge related information.
        - Remove redundant or outdated facts from the existing memory if the new points contradict or supersede them.
        - The final summary should be no more than 150 words.

        ---
        EXISTING MEMORY:
        ${currentMemory || 'No existing memory.'}
        ---
        NEW MEMORY POINTS TO INTEGRATE:
        - ${newSuggestions.join('\n- ')}
        ---
        NEW CONSOLIDATED MEMORY:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const newMemory = getText(response).trim();
        // Return the new memory, or the old one if generation fails/is empty
        return newMemory || currentMemory;
    } catch (error) {
        console.error("Memory consolidation failed:", parseApiError(error));
        // On error, return the original memory to avoid data loss.
        return currentMemory;
    }
};