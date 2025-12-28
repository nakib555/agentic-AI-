
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Splits text into optimal chunks for TTS generation.
 * Balances between low latency (short chunks) and natural flow (complete sentences).
 */
export const splitTextIntoChunks = (text: string, targetLength: number = 200): string[] => {
  if (!text) return [];
  if (text.length <= targetLength) return [text];

  // Regex to split by sentence boundaries (. ! ? \n), keeping the delimiter
  // This lookbehind regex matches punctuation followed by space or end of string
  const sentenceRegex = /[^.!?\n]+[.!?\n]+(\s+|$)|[^.!?\n]+$/g;
  const sentences = text.match(sentenceRegex) || [text];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence exceeds target length (and current chunk isn't empty),
    // push the current chunk and start a new one.
    if (currentChunk.length + sentence.length > targetLength && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};
