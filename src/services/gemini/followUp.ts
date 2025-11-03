/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import type { Message } from '../../types';
import { getText } from '../../utils/geminiUtils';
import { parseApiError } from './apiError';

export const generateFollowUpSuggestions = async (conversation: Message[]): Promise<string[]> => {
    if (conversation.length < 2) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const conversationTranscript = conversation
        .filter(msg => !msg.isHidden)
        .slice(-6) // Only use the last few turns for relevance
        .map(msg => `${msg.role}: ${msg.text.substring(0, 300)}`)
        .join('\n');

    const prompt = `
        Based on the recent conversation, suggest 3 concise and relevant follow-up questions the user might ask next.
        - The questions should be short and directly related to the last topic.
        - The output MUST be a valid JSON array of strings.
        - If no good suggestions can be made, return an empty array [].

        EXAMPLE:
        [
            "Can you explain that in simpler terms?",
            "Show me a code example.",
            "What are the alternatives?"
        ]

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
            return suggestions.slice(0, 3); // Ensure max 3 suggestions
        }
        return [];
    } catch (error) {
        console.error("Follow-up suggestion generation failed:", parseApiError(error));
        return [];
    }
};