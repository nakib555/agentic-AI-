
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
import { parseApiError } from './apiError.js';

export type GenerateContentStreamResult = AsyncGenerator<GenerateContentResponse> & {
  readonly response: Promise<GenerateContentResponse>;
};

const RETRYABLE_ERRORS = ['UNAVAILABLE', 'RATE_LIMIT_EXCEEDED', 'RESOURCE_EXHAUSTED', 'TIMEOUT', '429', '503', 'QUOTA_EXCEEDED'];
const MAX_RETRIES = 5; // Increased from 3 to 5 to handle strict free tier limits
const INITIAL_BACKOFF_MS = 3000; // Increased base backoff

// Global throttling to smooth out bursts
let lastRequestTimestamp = 0;
// Reduced from 2000ms to 200ms to optimize speed/smoothness while preventing instant burst errors
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
 * Extracts a wait time from error messages like "Please retry in 15.20s"
 */
function parseRetryDelay(errorMessage: string): number | null {
    const match = errorMessage.match(/retry in ([0-9.]+)(s|ms)/i);
    if (match) {
        let value = parseFloat(match[1]);
        if (match[2].toLowerCase() === 's') {
            value = value * 1000;
        }
        // Add a small buffer (500ms) to ensure we don't hit the exact edge
        return Math.ceil(value + 500); 
    }
    return null;
}

async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  // Throttle EVERY request start, including the first one.
  await throttle();

  let lastError: any = new Error("Retry operation failed.");
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const parsedError = parseApiError(error);
      const errorMessage = String(error) + " " + (parsedError.details || "");
      
      const isRetryable = RETRYABLE_ERRORS.some(code => 
        (parsedError.code || '').includes(code) || 
        (parsedError.message || '').toUpperCase().includes(code) ||
        errorMessage.toUpperCase().includes(code)
      );

      if (isRetryable) {
        // 1. Check for explicit retry delay in error message (common in Gemini 429 errors)
        const explicitDelay = parseRetryDelay(errorMessage);
        
        // 2. Calculate exponential backoff
        // Exponential backoff: 3s, 6s, 12s, 24s...
        const exponentialDelay = (INITIAL_BACKOFF_MS * Math.pow(2, i)) + (Math.random() * 1000);
        
        // Use the larger of the two
        const backoffTime = explicitDelay ? Math.max(explicitDelay, exponentialDelay) : exponentialDelay;

        console.warn(`[GEMINI_UTILS] API Limit/Error (${parsedError.code}). Retrying in ${(backoffTime/1000).toFixed(1)}s... (Attempt ${i + 1}/${MAX_RETRIES})`);
        
        await sleep(backoffTime);
        
        // After sleeping, we throttle again before the next attempt
        await throttle();
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

function applyModelFallback<T extends { model: string }>(request: T): T {
    const modelId = request.model;
    if (modelId.includes('pro')) {
        const newModel = modelId.replace('pro', 'flash');
        console.warn(`[FALLBACK] Model request failed. Falling back from '${modelId}' to '${newModel}'.`);
        return { ...request, model: newModel };
    }
    // Only fallback to flash if we aren't already there.
    if (modelId !== 'gemini-2.5-flash') {
        console.warn(`[FALLBACK] Model request failed for '${modelId}'. Falling back to 'gemini-2.5-flash'.`);
        return { ...request, model: 'gemini-2.5-flash' };
    }
    return request;
}

export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => ai.models.generateContent(request);
  try {
    return await retryOperation(operation);
  } catch (error) {
    // Only attempt fallback if we haven't already retried extensively within retryOperation
    // OR if the error wasn't strictly rate-limiting (e.g. model overload 503)
    console.warn(`[RETRY] All retries failed for model ${request.model}. Attempting fallback...`);
    const fallbackRequest = applyModelFallback(request);
    
    // If fallback is same as original (e.g. already flash), just re-throw
    if (fallbackRequest.model === request.model) throw error;

    await throttle();
    // One final try with the fallback model (no complex retry loop to avoid infinite waits)
    return await ai.models.generateContent(fallbackRequest);
  }
}

export async function generateContentStreamWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentStreamResult> {
  const operation = async () => (await ai.models.generateContentStream(request)) as unknown as GenerateContentStreamResult;
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.warn(`[RETRY] All retries failed for streaming model ${request.model}. Attempting fallback...`);
    const fallbackRequest = applyModelFallback(request);
    
    if (fallbackRequest.model === request.model) throw error;

    await throttle();
    return (await ai.models.generateContentStream(fallbackRequest)) as unknown as GenerateContentStreamResult;
  }
}

export async function generateImagesWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateImagesResponse> {
    const operation = async () => ai.models.generateImages(request);
    return await retryOperation(operation);
}

export const getText = (response: GenerateContentResponse): string => {
  return response.text || '';
};
