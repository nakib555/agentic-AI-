
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Splits text into optimal chunks for TTS generation.
 * 
 * LOGIC:
 * 1. Structural Split: Splits by double newlines (\n\n) first. This ensures that paragraphs 
 *    are treated as distinct audio events, providing natural pauses and preventing 
 *    the merging of unrelated sections (e.g., an intro line merging with a list item).
 * 2. Sentence Segmentation: Within each paragraph, uses Intl.Segmenter (or fallback) 
 *    to find linguistically correct sentence boundaries.
 * 3. Accumulation: Merges short sentences to reduce API calls, but NEVER merges 
 *    across paragraph boundaries.
 */
export const splitTextIntoChunks = (text: string, targetLength: number = 250): string[] => {
  if (!text) return [];
  if (text.length <= targetLength && !text.includes('\n')) return [text];

  const finalChunks: string[] = [];

  // Step 1: Split by "Hard" Boundaries (Paragraphs/Gaps)
  // We split by double newlines to identify distinct blocks of thought.
  const paragraphs = text.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      // Step 2: Segment sentences within this paragraph
      const sentences = getSentences(paragraph);

      // Step 3: Accumulate sentences into chunks
      let currentChunk = '';

      for (const sentence of sentences) {
          // Handle very long single sentences (force split)
          if (sentence.length > targetLength * 2) {
              if (currentChunk.trim()) {
                  finalChunks.push(currentChunk);
                  currentChunk = '';
              }
              const subChunks = sentence.match(new RegExp(`.{1,${targetLength}}\\b`, 'g')) || [sentence];
              finalChunks.push(...subChunks);
              continue;
          }

          // Accumulate
          if (currentChunk.length + sentence.length > targetLength && currentChunk.trim().length > 0) {
              finalChunks.push(currentChunk);
              currentChunk = sentence;
          } else {
              currentChunk += sentence;
          }
      }

      // Step 4: Force Flush at Paragraph End
      // This guarantees a pause between paragraphs
      if (currentChunk.trim().length > 0) {
          finalChunks.push(currentChunk);
      }
  }

  return finalChunks;
};

/**
 * Helper to get sentences from a text block using Intl.Segmenter or Regex Fallback.
 */
const getSentences = (text: string): string[] => {
    const sentences: string[] = [];

    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        try {
            // Use undefined locale to let browser detect language (supports CJK, etc.)
            const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'sentence' });
            const segments = segmenter.segment(text);
            for (const seg of segments) {
                sentences.push(seg.segment);
            }
            return sentences;
        } catch (e) {
            console.warn("Intl.Segmenter failed, falling back to regex.", e);
        }
    }

    return splitWithRegex(text);
};

/**
 * Robust fallback splitter that attempts to preserve all text content.
 * Includes support for CJK, Hindi, and explicit newline handling.
 */
const splitWithRegex = (text: string): string[] => {
    // Splits on:
    // 1. Terminators (.!?) followed by whitespace or EOL
    // 2. CJK/Hindi terminators
    // 3. Explicit single newlines (often used for lists) to ensure they aren't merged
    
    const splitRegex = /([.!?。？！।]+['"]?(?:\s+|$)|[\r\n]+)/;
    
    const parts = text.split(splitRegex);
    const sentences: string[] = [];
    
    for (let i = 0; i < parts.length; i += 2) {
        const content = parts[i];
        const delimiter = parts[i + 1] || ''; 
        
        if (content || delimiter) {
            sentences.push(content + delimiter);
        }
    }
    
    return sentences;
};
