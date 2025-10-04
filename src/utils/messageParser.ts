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
 * @param text The raw text content from the message.
 * @param isThinking A boolean indicating if the model is still processing.
 * @returns An object containing `thinkingText` and `finalAnswerText`.
 */
export const parseMessageText = (text: string, isThinking: boolean): ParseResult => {
  const finalAnswerMarker = '[STEP] Final Answer';
  const stepMarker = '[STEP]';
  const finalAnswerIndex = text.lastIndexOf(finalAnswerMarker);
  const hasThinkingSteps = text.includes(stepMarker);
  const thinkingIsComplete = !isThinking;

  let thinkingText = '';
  let finalAnswerText = '';

  if (finalAnswerIndex !== -1) {
    // Case 1: Ideal case with a final answer marker.
    thinkingText = text.substring(0, finalAnswerIndex);
    const rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
    finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
  } else if (thinkingIsComplete) {
      // Case 2: Thinking is complete, but the marker is missing. We need to parse.
      if (!hasThinkingSteps) {
          // Sub-case 2a: No steps at all, so the whole response is the final answer.
          thinkingText = '';
          finalAnswerText = text.trim();
      } else {
          // Sub-case 2b: There are steps. Assume everything that is not a step is the final answer.
          // This regex finds all step blocks.
          const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/g;
          const matches = [...text.matchAll(stepRegex)];
          
          if (matches.length > 0) {
              // Find the end of the last matched step block.
              const lastMatch = matches[matches.length - 1];
              const lastMatchEnd = (lastMatch.index || 0) + lastMatch[0].length;
              
              // Everything up to that point is considered thinking text.
              thinkingText = text.substring(0, lastMatchEnd);
              
              // Anything after the last step is the final answer.
              finalAnswerText = text.substring(lastMatchEnd).trim();
          } else {
              // Should not be reached due to `hasThinkingSteps` check, but as a fallback:
              thinkingText = '';
              finalAnswerText = text.trim();
          }
      }
  } else {
      // Case 3: We are still actively thinking. The entire text is part of the workflow.
      thinkingText = text;
      finalAnswerText = '';
  }

  return { thinkingText, finalAnswerText };
};