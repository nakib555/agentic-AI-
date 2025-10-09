/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type ParseResult = {
  thinkingText: string;
  finalAnswerText: string;
};

/**
 * Parses the raw text from a model's message into distinct "thinking" and "final answer" parts.
 * This function uses the `isThinking` and `hasError` flags to provide context and prevent UI flickering.
 * @param text The raw text content from the message.
 * @param isThinking A boolean indicating if the model is still processing.
 * @param hasError A boolean indicating if an error occurred.
 * @returns An object containing `thinkingText` and `finalAnswerText`.
 */
export const parseMessageText = (text: string, isThinking: boolean, hasError: boolean): ParseResult => {
  const finalAnswerMarker = '[STEP] Final Answer';
  const finalAnswerIndex = text.lastIndexOf(finalAnswerMarker);

  // Rule 1: Highest priority. If the final answer marker exists, we can definitively split the text.
  // This is true whether the stream is still technically "thinking" or not.
  if (finalAnswerIndex !== -1) {
    const thinkingText = text.substring(0, finalAnswerIndex);
    const rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
    const finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    return { thinkingText, finalAnswerText };
  }

  // Rule 2: If an error occurred mid-thought, ALL text is considered part of the failed thinking process.
  // The final answer should be empty because it was never reached.
  if (hasError) {
    return { thinkingText: text, finalAnswerText: '' };
  }
  
  // Rule 3: If there's no final answer marker, check if the model is still actively thinking.
  // If it is, ALL text so far is considered part of the thinking process, even if it doesn't
  // have a `[STEP]` marker yet. This prevents an initial flicker of content in the final answer area.
  if (isThinking) {
    return { thinkingText: text, finalAnswerText: '' };
  }

  // Rule 4: At this point, thinking is complete and there is no error.
  // If the text contains any STEP markers but no Final Answer marker, it's an incomplete thought process.
  // Treat the entire text as thinking to keep it in the thought bubble.
  if (text.includes('[STEP]')) {
      return { thinkingText: text, finalAnswerText: '' };
  }

  // Rule 5: If none of the above conditions are met (not thinking, no error, no markers),
  // then the entire response must be a direct final answer (e.g., from a simple query).
  return { thinkingText: '', finalAnswerText: text.trim() };
};