/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
// FIX: Correct the relative import path for types.
import type { Message } from '../../types';
import { getText } from '../../utils/geminiUtils';
import { parseApiError } from './apiError';

const MAX_TITLE_RETRIES = 3;
const INITIAL_TITLE_BACKOFF_MS = 2000;

export const generateChatTitle = async (messages: Message[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // Sanitize message content to prevent prompt injection issues, focusing on the text part.
    const conversationHistory = messages
        .map(msg => `${msg.role}: ${msg.text.substring(0, 500)}`) // Truncate long messages
        .join('\n');

    const prompt = `Based on the following conversation, suggest a short and concise title (5 words maximum). Do not use quotes in the title.
    
    CONVERSATION:
    ${conversationHistory}
    
    TITLE:`;

    for (let attempt = 0; attempt < MAX_TITLE_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = getText(response);
            const generatedTitle = text.trim().replace(/["']/g, '');
            const isGeneric = !generatedTitle || ['new chat', 'untitled chat'].includes(generatedTitle.toLowerCase());

            // If the AI returns a generic or empty title, fall back to the first user message.
            if (isGeneric) {
                return messages.find(m => m.role === 'user')?.text || 'Untitled Chat';
            }

            return generatedTitle;
        } catch (error) {
            const structuredError = parseApiError(error);
            console.error(`Title generation API call failed (attempt ${attempt + 1}/${MAX_TITLE_RETRIES}):`, structuredError.message);

            // Retry on rate limit or generic API errors.
            const isRetryable = structuredError.code === 'RATE_LIMIT_EXCEEDED' || structuredError.code === 'API_ERROR';

            if (isRetryable && attempt < MAX_TITLE_RETRIES - 1) {
                const delay = INITIAL_TITLE_BACKOFF_MS * (2 ** attempt);
                console.log(`Retrying title generation in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // If it's not a retryable error, or we've exhausted retries, break and fall back.
                break;
            }
        }
    }
    
    // Fallback if all retries fail or a non-retryable error occurs
    console.warn("Title generation failed, falling back to first user message.");
    const firstUserMessage = messages.find(m => m.role === 'user')?.text || 'Untitled Chat';
    return firstUserMessage;
};