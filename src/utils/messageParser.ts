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
  if (finalAnswerIndex !== -1) {
    const thinkingText = text.substring(0, finalAnswerIndex);
    const rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
    const finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    return { thinkingText, finalAnswerText };
  }

  // Rule 2: If an error occurred mid-thought, ALL text is considered part of the failed thinking process.
  if (hasError) {
    return { thinkingText: text, finalAnswerText: '' };
  }

  // A "definite workflow" contains planning headers or intermediate step markers.
  // The absence of these implies a direct answer is being streamed.
  const isDefiniteWorkflow = text.includes('## Initial Plan/Goal Analysis') 
      || text.includes('[STEP] Act:') 
      || text.includes('[STEP] Observe:') 
      || text.includes('[STEP] Adapt:');

  // Rule 3: Handle streaming state
  if (isThinking) {
    if (isDefiniteWorkflow) {
      // If we've identified a workflow, all streaming text is part of the thinking process.
      return { thinkingText: text, finalAnswerText: '' };
    } else {
      // If it's not a definite workflow, it's likely a direct answer stream.
      // We return empty strings to prevent the "Thought" bubble from flickering on,
      // while allowing the typing indicator to show. The content will be populated by Rule 1 once complete.
      return { thinkingText: '', finalAnswerText: '' };
    }
  }

  // Rule 4: Handle completed state (isThinking is false)
  if (isDefiniteWorkflow) {
    // If thinking is done but the text indicates an incomplete workflow (no Final Answer),
    // keep everything in the "Thought" bubble.
    return { thinkingText: text, finalAnswerText: '' };
  } else {
    // If it's not a workflow and thinking is done, it's a direct final answer.
    return { thinkingText: '', finalAnswerText: text.trim() };
  }
};