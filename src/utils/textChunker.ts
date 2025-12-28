
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
  // Matches:
  // 1. [^.!?\n]+       : Any chars that aren't terminators
  // 2. [.!?\n]+        : One or more terminators
  // 3. (\s+|$)         : Trailing whitespace or end of string
  // OR
  // 4. [^.!?\n]+$      : Any remaining chars at the end of string (no terminator)
  const sentenceRegex = /[^.!?\n]+[.!?\n]+(\s+|$)|[^.!?\n]+$/g;
  
  const sentences = text.match(sentenceRegex) || [text];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If a single sentence is massive (e.g. code block without punctuation), split it by hard length
    if (sentence.length > targetLength * 1.5) {
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
        // Force split the long sentence
        const subChunks = sentence.match(new RegExp(`.{1,${targetLength}}`, 'g')) || [sentence];
        chunks.push(...subChunks);
        continue;
    }

    // Normal accumulation
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
