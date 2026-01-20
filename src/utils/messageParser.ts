
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
 * Updated to be more robust for mixed-mode content and prevent hiding valid text.
 * @param text The raw text content from the message.
 * @param isThinking A boolean indicating if the model is still processing.
 * @param hasError A boolean indicating if an error occurred.
 * @returns An object containing `thinkingText` and `finalAnswerText`.
 */
export const parseMessageText = (text: string, isThinking: boolean, hasError: boolean): ParseResult => {
  const finalAnswerMarker = '[STEP] Final Answer:';
  const finalAnswerIndex = text.lastIndexOf(finalAnswerMarker);

  // 1. Explicit Final Answer Split (Highest Priority)
  // If the model explicitly marks the final answer, we always respect it.
  if (finalAnswerIndex !== -1) {
    const thinkingText = text.substring(0, finalAnswerIndex);
    let rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
    
    // Strip the agent tag (e.g., ": [AGENT: Reporter]") from the beginning of the final answer.
    const agentTagRegex = /^\s*:?\s*\[AGENT:\s*[^\]]+\]\s*/;
    rawFinalAnswer = rawFinalAnswer.replace(agentTagRegex, '');

    const finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    return { thinkingText, finalAnswerText };
  }

  // 2. Implicit Classification
  // If no final answer marker is found, we decide based on the *structure* of the text.
  // We strictly identify "Agent Mode" content by checking if it STARTS with a step marker.
  // This prevents chatty models that mention "[STEP]" in conversation from being hidden.

  const trimmed = text.trimStart();
  const isAgentStructure = trimmed.startsWith('[STEP]') || trimmed.startsWith('[BRIEFING]');

  if (isAgentStructure) {
      // It looks like an internal thought trace or agent log. 
      // Hide it from the main bubble (it will be rendered by the Workflow UI).
      return { thinkingText: text, finalAnswerText: '' };
  }

  // 3. Default Fallback
  // It's a direct response (Chat Mode), or a mixed response that didn't follow strict protocol.
  // Show it as the final answer to ensure visibility.
  return { thinkingText: '', finalAnswerText: text.trim() };
};
