
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleGenAI,
  GenerateContentParameters,
  GenerateImagesResponse,
  GenerateContentResponse,
} from "@google/genai";

// Define the result type for streaming, compatible with the SDK's return type.
export type GenerateContentStreamResult = AsyncIterable<GenerateContentResponse> & {
  readonly response: Promise<GenerateContentResponse>;
};

// Global throttling to smooth out bursts
let lastRequestTimestamp = 0;
// Reduced interval to improve responsiveness
const MIN_REQUEST_INTERVAL = 200; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enforces a minimum time interval between API calls to prevent bursts.
 */
async function throttle() {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTimestamp;
    
    if (timeSinceLast < MIN_REQUEST_INTERVAL) {
        const wait = MIN_REQUEST_INTERVAL - timeSinceLast;
        lastRequestTimestamp = now + wait; // Reserve the slot
        await sleep(wait);
    } else {
        lastRequestTimestamp = now;
    }
}

/**
 * Wrapper for API calls that handles 429/503 errors with exponential backoff.
 */
async function executeOperationWithRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    baseDelay = 2000
): Promise<T> {
    await throttle();
    
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            const status = error.status || error.response?.status || 0;
            const message = (error.message || '').toUpperCase();
            
            // Check for Rate Limit (429)
            // Includes generic 429 status and specific quota error messages
            const isRateLimit = status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('QUOTA');
            
            // Check for Server Errors (5xx) or Overload
            // 503 (Unavailable), 500 (Internal), 502 (Bad Gateway), 504 (Timeout)
            const isTransient = status >= 500 || message.includes('503') || message.includes('UNAVAILABLE') || message.includes('OVERLOADED') || message.includes('TIMEOUT') || message.includes('INTERNAL SERVER ERROR');
            
            if (isRateLimit || isTransient) {
                // Exponential backoff: 2s, 4s, 8s... + Random Jitter (0-1000ms) to prevent thundering herd
                const delay = baseDelay * Math.pow(2, i) + (Math.random() * 1000);
                console.warn(`[GeminiUtils] API Error (${status || 'Unknown'}). Retrying in ${Math.round(delay)}ms... (Attempt ${i+1}/${retries})`);
                await sleep(delay);
                continue;
            }
            
            // If it's a different error (e.g. 400 Bad Request, 401 Unauthorized), throw immediately
            throw error;
        }
    }
    
    throw lastError;
}

export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => {
    // DIRECT call to generateContent (non-streaming).
    // This is required for TTS and other models that do not support streaming or where atomic response is preferred.
    return await ai.models.generateContent(request);
  };
  return await executeOperationWithRetry(operation);
}

export async function generateContentStreamWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentStreamResult> {
  const operation = async () => {
      return (await ai.models.generateContentStream(request)) as unknown as GenerateContentStreamResult;
  };
  return await executeOperationWithRetry(operation);
}

export async function generateImagesWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateImagesResponse> {
    const operation = async () => ai.models.generateImages(request);
    return await executeOperationWithRetry(operation);
}

export async function generateVideosWithRetry(ai: GoogleGenAI, request: any): Promise<any> {
    const operation = async () => ai.models.generateVideos(request);
    return await executeOperationWithRetry(operation);
}

export const getText = (response: GenerateContentResponse): string => {
  // Safe access to .text property.
  // The SDK might throw if .text is accessed on a response that doesn't contain text (e.g. usage metadata only).
  try {
    return response.text || '';
  } catch (e) {
    return '';
  }
};
