
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Content, Part } from "@google/genai";
import { Message } from '../../src/types';

/**
 * Parses the raw text to separate thinking process from final answer.
 * Replicated from frontend logic to ensure consistency.
 */
const parseMessageText = (text: string): { thinkingText: string, finalAnswerText: string } => {
  const finalAnswerMarker = '[STEP] Final Answer:';
  const finalAnswerIndex = text.lastIndexOf(finalAnswerMarker);

  if (finalAnswerIndex !== -1) {
    const thinkingText = text.substring(0, finalAnswerIndex);
    let rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
    const agentTagRegex = /^\s*:?\s*\[AGENT:\s*[^\]]+\]\s*/;
    rawFinalAnswer = rawFinalAnswer.replace(agentTagRegex, '');
    const finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    return { thinkingText, finalAnswerText };
  }
  
  // If we assume the message is complete (from DB), and no marker, treating entire text as answer
  // might be safer for context injection, or we stick to the rule:
  return { thinkingText: '', finalAnswerText: text.trim() };
};

export const transformHistoryToGeminiFormat = (messages: Message[]): Content[] => {
    const historyForApi: Content[] = [];
    
    messages.forEach((msg: Message) => {
        if (msg.isHidden) return;

        if (msg.role === 'user') {
            const parts: Part[] = [];
            if (msg.text) parts.push({ text: msg.text });
            if (msg.attachments) {
                msg.attachments.forEach(att => parts.push({
                    inlineData: { mimeType: att.mimeType, data: att.data }
                }));
            }
            if (parts.length > 0) {
                historyForApi.push({ role: 'user', parts });
            }
        } else if (msg.role === 'model') {
            const activeResponse = msg.responses?.[msg.activeResponseIndex];
            if (!activeResponse) return;

            // We send the FULL text (thought + answer) to the model so it maintains its own chain of thought context
            const fullText = activeResponse.text; 
            const modelParts: Part[] = [];
            const functionResponseParts: Part[] = [];

            if (fullText) {
                modelParts.push({ text: fullText });
            }

            if (activeResponse.toolCallEvents) {
                activeResponse.toolCallEvents.forEach(event => {
                    // Turn-based logic:
                    // If a tool has a result, it means the model called it, and we (user/system) provided a response.
                    // The Model's turn includes the FunctionCall.
                    // The User's turn (next) includes the FunctionResponse.
                    
                    if (event.result !== undefined) {
                        functionResponseParts.push({
                            functionResponse: {
                                name: event.call.name,
                                response: { result: event.result }
                            }
                        });
                    } else {
                        // Include the tool call in the model's turn
                        modelParts.push({ functionCall: event.call });
                    }
                });
            }

            if (modelParts.length > 0) {
                historyForApi.push({ role: 'model', parts: modelParts });
            }
            if (functionResponseParts.length > 0) {
                historyForApi.push({ role: 'user', parts: functionResponseParts });
            }
        }
    });
    return historyForApi;
};
