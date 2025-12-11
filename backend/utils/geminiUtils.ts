
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

// Define the result type for streaming, compatible with the SDK's return type.
// The SDK returns an object that is both an async iterable and has a .response promise.
export type GenerateContentStreamResult = AsyncIterable<GenerateContentResponse> & {
  readonly response: Promise<GenerateContentResponse>;
};

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

async function executeOperation<T>(operation: () => Promise<T>): Promise<T> {
  await throttle();
  return await operation();
}

/**
 * Generates content using the streaming endpoint (`generateContentStream`) but waits for the full response.
 * This ensures compliance with the requirement to use the streaming endpoint for all model calls.
 */
export async function generateContentWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const operation = async () => {
    // CRITICAL: Always use generateContentStream.
    const streamResult = (await ai.models.generateContentStream(request)) as unknown as GenerateContentStreamResult;
    // Wait for the stream to finish and return the aggregated response.
    return await streamResult.response;
  };
  return await executeOperation(operation);
}

/**
 * Generates content using the streaming endpoint (`generateContentStream`) and returns the stream iterable.
 */
export async function generateContentStreamWithRetry(ai: GoogleGenAI, request: GenerateContentParameters): Promise<GenerateContentStreamResult> {
  const operation = async () => {
      // Cast is generally not needed if types align, but ensures compatibility if SDK types are strict
      return (await ai.models.generateContentStream(request)) as unknown as GenerateContentStreamResult;
  };
  return await executeOperation(operation);
}

export async function generateImagesWithRetry(ai: GoogleGenAI, request: any): Promise<GenerateImagesResponse> {
    const operation = async () => ai.models.generateImages(request);
    return await executeOperation(operation);
}

// Changed return type to Promise<any> to support operation object return structure 
// required for polling, as SDK types for LROs might vary.
export async function generateVideosWithRetry(ai: GoogleGenAI, request: any): Promise<any> {
    const operation = async () => ai.models.generateVideos(request);
    return await executeOperation(operation);
}

export const getText = (response: GenerateContentResponse): string => {
  return response.text || '';
};
