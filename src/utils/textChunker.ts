
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Splits text into optimal chunks for TTS generation.
 * Uses Intl.Segmenter for linguistically accurate sentence boundaries where available.
 * Balances between low latency (short chunks) and natural flow (complete sentences).
 * Now supports multi-language segmentation by defaulting to system locale and
 * expanding regex fallback for international punctuation.
 */
export const splitTextIntoChunks = (text: string, targetLength: number = 250): string[] => {
  if (!text) return [];
  if (text.length <= targetLength) return [text];

  let sentences: string[] = [];

  // Strategy 1: Modern Intl.Segmenter (Preferred)
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      // Use undefined locale to let the browser use the system default or auto-detect from text.
      // This provides the broadest support for mixed-language content (English, CJK, etc.)
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'sentence' });
      const segments = segmenter.segment(text);
      for (const seg of segments) {
        sentences.push(seg.segment);
      }
    } catch (e) {
      console.warn("Intl.Segmenter failed, falling back to regex splitting.", e);
      sentences = splitWithRegex(text);
    }
  } else {
    // Strategy 2: Fallback Regex
    sentences = splitWithRegex(text);
  }

  // Combine sentences into chunks
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // Handling for very long single sentences (e.g. code or lists without punctuation)
    if (sentence.length > targetLength * 2) {
        if (currentChunk.trim()) {
            chunks.push(currentChunk); // Preserve whitespace for natural pause in TTS
            currentChunk = '';
        }
        
        // Force split the long sentence by character length
        // We use a safe split that doesn't break words if possible
        const subChunks = sentence.match(new RegExp(`.{1,${targetLength}}\\b`, 'g')) || [sentence];
        // If regex fails to split (e.g. huge string with no breaks or CJK characters where \b might fail), hard split
        if (subChunks.length === 1 && sentence.length > targetLength) {
             const hardSplit = sentence.match(new RegExp(`.{1,${targetLength}}`, 'g')) || [sentence];
             chunks.push(...hardSplit);
        } else {
             chunks.push(...subChunks);
        }
        continue;
    }

    // Accumulate sentences until target length is reached
    // Note: We use length of combined string to check limit
    if (currentChunk.length + sentence.length > targetLength && currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

/**
 * Robust fallback splitter that attempts to preserve all text content.
 * Includes support for CJK and other international punctuation.
 */
const splitWithRegex = (text: string): string[] => {
    // This regex splits on sentence terminators followed by whitespace or end of line.
    // We capture the delimiter to re-attach it.
    // Includes:
    // - Standard: . ! ?
    // - CJK: 。 (Ideographic Full Stop), ？ (Fullwidth Question Mark), ！ (Fullwidth Exclamation Mark)
    // - Hindi/Sanskrit: । (Danda)
    // - Newlines (\n) to respect paragraph breaks
    
    // Pattern: ([Terminators])(Optional Quote)(Whitespace OR EndOfLine)
    const splitRegex = /([.!?。？！।]+['"]?(?:\s+|$)|(?:\r?\n)+)/;
    
    const parts = text.split(splitRegex);
    const sentences: string[] = [];
    
    // The split will result in: [Content, Delimiter, Content, Delimiter...]
    // We iterate by 2 to recombine Content + Delimiter.
    for (let i = 0; i < parts.length; i += 2) {
        const content = parts[i];
        const delimiter = parts[i + 1] || ''; // Delimiter is next, might be undefined at end
        
        // Only push if there is actual content or a significant delimiter
        if (content || delimiter) {
            sentences.push(content + delimiter);
        }
    }
    
    return sentences;
};
