
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

  // Enhanced regex to split by sentence boundaries while respecting quotes and common abbreviations.
  // It looks for:
  // 1. A period, exclamation, or question mark.
  // 2. Followed by a quote (optional)
  // 3. Followed by whitespace or end of string.
  // It specifically tries NOT to split on common abbreviations like "Mr.", "Dr.", "e.g." (simple heuristic: look for space after).
  
  // This regex matches a sentence:
  // [^.!?\n]+      : One or more non-terminator chars
  // [.!?\n]+       : One or more terminators
  // ['"]?          : Optional closing quote
  // (\s+|$)        : Trailing space or EOF
  const sentenceRegex = /[^.!?\n]+[.!?\n]+['"]?(\s+|$)|[^.!?\n]+$/g;
  
  const sentences = text.match(sentenceRegex) || [text];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // Handling for very long single sentences (e.g. code or lists without punctuation)
    if (sentence.length > targetLength * 1.5) {
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
        // Force split the long sentence by length to avoid API timeouts
        const subChunks = sentence.match(new RegExp(`.{1,${targetLength}}`, 'g')) || [sentence];
        chunks.push(...subChunks);
        continue;
    }

    // Accumulate sentences until target length is reached
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
