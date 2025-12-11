
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleGenAI,
  GenerateContentParameters,
  GenerateImagesResponse,
  GenerateContentResponse,
  GenerateVideosResponse,
} from "@google/genai";
import { parseApiError } from './apiError.js';

// Define the result type for streaming, compatible with the SDK's return type.
// The SDK returns an object that is both an async iterable and has a .response promise.
export type GenerateContentStreamResult = AsyncIterable<GenerateContentResponse> & {
  readonly response: Promise<GenerateContentResponse>;
};

const RETRYABLE_ERRORS = ['UNAVAILABLE', 'RATE_LIMIT_EXCEEDED', 'RESOURCE_EXHAUSTED', 'TIMEOUT', '429', '503', 'QUOTA_EXCEEDED'];
const MAX_RETRIES = 5; 
const INITIAL_BACKOFF_MS = 3000; 

// Global throttling to smooth out bursts
let lastRequestTimestamp = 0;
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
        return Math.ceil(value + 500); 
    }
    return null;
}

async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
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
        const explicitDelay = parseRetryDelay(errorMessage);
        const exponentialDelay = (INITIAL_BACKOFF_MS * Math.pow(2, i)) + (Math.random() * 1000);
        const backoffTime = explicitDelay ? Math.max(explicitDelay, exponentialDelay) : exponentialDelay;

        console.warn(`[GEMINI_UTILS] API Limit/Error (${parsedError.code}). Retrying in ${(backoffTime/1000).toFixed(1)}s... (Attempt ${i + 1}/${MAX_RETRIES})`);
        
        await sleep(backoffTime);
        await throttle();
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

/**
 * Generates content using the streaming endpoint (`generateContentStream`) but waits for the full response.
 * This ensures compliance with the requirement to use the streaming endpoint for all model calls.
 */
export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => {
    // CRITICAL: Always use generateContentStream.
    const streamResult = await ai.models.generateContentStream(request);
    // Wait for the stream to finish and return the aggregated response.
    return await streamResult.response;
  };
  return await retryOperation(operation);
}

/**
 * Generates content using the streaming endpoint (`generateContentStream`) and returns the stream iterable.
 */
export async function generateContentStreamWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentStreamResult> {
  const operation = async () => {
      // Cast is generally not needed if types align, but ensures compatibility if SDK types are strict
      return await ai.models.generateContentStream(request) as GenerateContentStreamResult;
  };
  return await retryOperation(operation);
}

export async function generateImagesWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateImagesResponse> {
    const operation = async () => ai.models.generateImages(request);
    return await retryOperation(operation);
}

export async function generateVideosWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateVideosResponse> {
    const operation = async () => ai.models.generateVideos(request);
    return await retryOperation(operation);
}

export const getText = (response: GenerateContentResponse): string => {
  return response.text || '';
};
