/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GenerateContentResponse } from '@google/genai';

/**
 * Safely extracts and concatenates all text parts from a GenerateContentResponse or a stream chunk.
 * This avoids using the `.text` accessor which can log warnings if the response contains non-text parts.
 * @param response The response or chunk from the Gemini API.
 * @returns A string containing the concatenated text content.
 */
export const getText = (response: GenerateContentResponse): string => {
  if (!response?.candidates?.length) {
    return '';
  }

  let text = '';
  for (const candidate of response.candidates) {
    if (candidate.content?.parts?.length) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          text += part.text;
        }
      }
    }
  }
  return text;
};
