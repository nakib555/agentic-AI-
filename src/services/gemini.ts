/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { toolDeclarations } from '../../tools';
import { systemInstruction } from '../prompts/system';
import type { Message, MessageError } from '../../types';

// Define the type for chat history based on the expected structure for the API
type ChatHistory = {
    role: 'user' | 'model';
    parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } } | { functionResponse: any } | { functionCall: any })[];
}[];

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

    // Fallback for other generic API or network errors
    return {
        code: 'API_ERROR',
        message: message, // Use the extracted message
        details: details, // Use the extracted details
    };
};

export const initChat = (model: string, history?: ChatHistory) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const modelToUse = model;

    return ai.chats.create({
      model: modelToUse,
      history,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });
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
            
            const text = response.text ?? '';
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