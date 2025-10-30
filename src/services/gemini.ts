/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Import the 'Part' type from the library to ensure type safety.
import { GoogleGenAI, type GenerateContentResponse, type Part } from "@google/genai";
import { toolDeclarations } from '../tools';
import { systemInstruction } from '../prompts/system';
import type { Message, MessageError } from '../../types';
import { getText } from '../utils/geminiUtils';

// Define the type for chat history based on the expected structure for the API
type ChatHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

type ChatSettings = { 
    systemPrompt?: string; 
    temperature?: number; 
    maxOutputTokens?: number;
    thinkingBudget?: number;
    memoryContent?: string;
};

/**
 * Parses a generic Error from the Gemini API into a structured MessageError.
 * @param error The error object thrown by the API client.
 * @returns A structured MessageError with user-friendly content.
 */
export const parseApiError = (error: any): MessageError => {
    // Extract message, details, and status for robust classification
    let message = 'An unexpected API error occurred';
    let details = '';
    let status = '';
    
    if (error instanceof Error) {
        message = error.message;
        details = error.stack || error.toString();
    } else if (typeof error === 'object' && error !== null) {
        // Handle Google API's specific structured error response like:
        // {"error":{"code":429,"message":"...", "status":"RESOURCE_EXHAUSTED"}}
        if (error.error && typeof error.error.message === 'string') {
            message = error.error.message;
            if (error.error.status && typeof error.error.status === 'string') {
                status = error.error.status;
            }
        } else if (typeof error.message === 'string') {
            message = error.message;
        }
        try {
            details = JSON.stringify(error, null, 2);
        } catch (e) {
            details = 'Could not stringify the error object.';
        }
    } else {
        message = String(error);
        details = String(error);
    }

    const lowerCaseMessage = message.toLowerCase();
    const lowerCaseStatus = status.toLowerCase();

    // 1. Invalid API Key
    if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('api key not found') || lowerCaseStatus === 'permission_denied') {
        return {
            code: 'INVALID_API_KEY',
            message: 'Invalid or Missing API Key',
            details: 'The API key is missing, invalid, or has expired. Please ensure it is configured correctly in your environment variables.'
        };
    }

    // 2. Rate Limiting / Quota Exceeded
    if (lowerCaseStatus === 'resource_exhausted' || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit')) {
        return {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API Rate Limit Exceeded',
            details: `You have sent too many requests or exceeded your quota. Please check your API plan and billing details. Original error: ${message}`
        };
    }
    
    // 3. Content Blocked by Safety Settings
    if (lowerCaseMessage.includes('response was blocked') || lowerCaseMessage.includes('safety policy')) {
        return {
            code: 'CONTENT_BLOCKED',
            message: 'Response Blocked by Safety Filter',
            details: 'The model\'s response was blocked due to the safety policy. This can happen if the prompt or the generated content is deemed unsafe. Please try rephrasing your request.'
        };
    }
    
    // 4. Model Not Found
    if (lowerCaseStatus === 'not_found' || lowerCaseMessage.includes('404') || lowerCaseMessage.includes('model not found')) {
        return {
            code: 'MODEL_NOT_FOUND',
            message: 'Model Not Found',
            details: `The model ID specified in the request could not be found. Please check the model name and ensure you have access to it. Original error: ${message}`
        };
    }
    
    // 5. Invalid Argument (e.g., malformed request)
    if (lowerCaseStatus === 'invalid_argument' || lowerCaseMessage.includes('400') || lowerCaseMessage.includes('bad request')) {
        return {
            code: 'INVALID_ARGUMENT',
            message: 'Invalid Request Sent',
            details: `The request was malformed or contained invalid parameters. Details: ${message}`
        };
    }

    // 6. Network Error
    if (lowerCaseMessage.includes('failed to fetch')) {
        return {
            code: 'NETWORK_ERROR',
            message: 'Network Error',
            details: `A network problem occurred, possibly due to a lost internet connection. Original error: ${details}`
        };
    }

    // Fallback for other generic API or network errors
    return {
        code: 'API_ERROR',
        message: message, // Use the extracted message
        details: details, // Use the extracted details
    };
};

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