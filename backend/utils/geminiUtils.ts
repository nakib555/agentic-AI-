/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GenerateContentResponse } from '@google/genai';

/**
 * Safely extracts text from a GenerateContentResponse or a stream chunk.
 * This aligns with the latest SDK guidance to use the direct .text accessor.
 * @param response The response or chunk from the Gemini API.
 * @returns A string containing the concatenated text content.
 */
export const getText = (response: GenerateContentResponse): string => {
  return response.text;
};