
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
const MAX_RETRIES = 3; 
const INITIAL_BACKOFF_MS = 2000;

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

async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  // Throttle EVERY request start, including the first one.
  // This ensures that even parallel calls from different parts of the app don't hit the API in the same millisecond.
  await throttle();

  let lastError: any = new Error("Retry operation failed.");
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const parsedError = parseApiError(error);
      
      const isRetryable = RETRYABLE_ERRORS.some(code => 
        (parsedError.code || '').includes(code) || 
        (parsedError.message || '').toUpperCase().includes(code) ||
        String(error).toUpperCase().includes(code)
      );

      if (isRetryable) {
        // Exponential backoff with jitter
        const backoffTime = (INITIAL_BACKOFF_MS * Math.pow(2, i)) + (Math.random() * 1000);
        console.warn(`[GEMINI_UTILS] API Rate Limit/Error (${parsedError.code}). Retrying in ${backoffTime.toFixed(0)}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
        
        await sleep(backoffTime);
        
        // After sleeping, we throttle again before the next attempt to ensure we don't just wake up and burst again
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
    console.warn(`[FALLBACK] Model request failed for '${modelId}'. Falling back to 'gemini-2.5-flash'.`);
    return { ...request, model: 'gemini-2.5-flash' };
}

export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => ai.models.generateContent(request);
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.warn(`[RETRY] All retries failed for model ${request.model}. Attempting fallback...`);
    const fallbackRequest = applyModelFallback(request);
    // Throttle the fallback too
    await throttle();
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
