
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleGenAI,
  GenerateContentParameters,
  GenerateImagesResponse,
  GenerateContentResponse,
  // FIX: GenerateContentStreamResult is not an exported member of @google/genai.
  // It has been removed from imports.
} from "@google/genai";
import { parseApiError } from './apiError.js';

// FIX: The type for the result of a streaming content generation call is not exported.
// This local type definition mirrors the expected structure: an async generator
// of response chunks, with an added `response` property for the final aggregated response.
export type GenerateContentStreamResult = AsyncGenerator<GenerateContentResponse> & {
  readonly response: Promise<GenerateContentResponse>;
};

const RETRYABLE_ERRORS = ['UNAVAILABLE', 'RATE_LIMIT_EXCEEDED', 'RESOURCE_EXHAUSTED', 'TIMEOUT'];
// Drastically increased retries to handle strict rate limits on free tier
const MAX_RETRIES = 10; 
const INITIAL_BACKOFF_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic retry wrapper
async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: any = new Error("Retry operation failed after maximum attempts.");
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const parsedError = parseApiError(error);
      
      // Check if error is retryable
      if (RETRYABLE_ERRORS.includes(parsedError.code || '')) {
        // Exponential backoff with jitter: 2s, 4s, 8s, 16s, 32s...
        // This allows recovering from 1-minute quota resets.
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000;
        
        console.warn(`[RETRY] Retrying operation due to ${parsedError.code}. Attempt ${i + 1}/${MAX_RETRIES}. Waiting ${backoffTime.toFixed(0)}ms...`);
        
        await sleep(backoffTime);
      } else {
        // Not a retryable error, fail fast.
        throw error;
      }
    }
  }
  // If all retries fail, throw the last captured error.
  throw lastError;
}

// Model fallback logic
function applyModelFallback<T extends { model: string }>(request: T): T {
    const modelId = request.model;
    if (modelId.includes('pro')) {
        const newModel = modelId.replace('pro', 'flash');
        console.warn(`[FALLBACK] Model request failed. Falling back from '${modelId}' to '${newModel}'.`);
        return { ...request, model: newModel };
    }
    // Fallback for any other case to the base flash model
    console.warn(`[FALLBACK] Model request failed for '${modelId}'. Falling back to 'gemini-2.5-flash'.`);
    return { ...request, model: 'gemini-2.5-flash' };
}

// FIX: Replaced GenerateContentRequest with GenerateContentParameters
export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => ai.models.generateContent(request);
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.warn(`[RETRY] All retries failed for model ${request.model}. Attempting fallback...`);
    // After all retries fail, try one last time with a fallback model.
    const fallbackRequest = applyModelFallback(request);
    return await ai.models.generateContent(fallbackRequest);
  }
}

// FIX: Replaced GenerateContentStreamRequest with GenerateContentParameters and updated return type
export async function generateContentStreamWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentStreamResult> {
  const operation = async () => (await ai.models.generateContentStream(request)) as unknown as GenerateContentStreamResult;
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.warn(`[RETRY] All retries failed for streaming model ${request.model}. Attempting fallback...`);
    // After all retries fail, try one last time with a fallback model.
    const fallbackRequest = applyModelFallback(request);
    return (await ai.models.generateContentStream(fallbackRequest)) as unknown as GenerateContentStreamResult;
  }
}

// FIX: Removed GenerateImagesRequest type from signature
export async function generateImagesWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateImagesResponse> {
    const operation = async () => ai.models.generateImages(request);
    // No model fallback for imagen, just retry.
    return await retryOperation(operation);
}

/**
 * Safely extracts text from a GenerateContentResponse or a stream chunk.
 * This aligns with the latest SDK guidance to use the direct .text accessor.
 * @param response The response or chunk from the Gemini API.
 * @returns A string containing the concatenated text content.
 */
export const getText = (response: GenerateContentResponse): string => {
  return response.text;
};
