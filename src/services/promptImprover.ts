/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { parseApiError } from './gemini';
import { getText } from '../utils/geminiUtils';

/**
 * Enhances a user's prompt by streaming a rewritten version from the Gemini API.
 * @param userInput The original text from the user.
 * @returns An async generator that yields chunks of the enhanced prompt string.
 * @throws An error if the API call fails or the model returns an empty response.
 */
export async function* enhanceUserPromptStream(userInput: string): AsyncGenerator<string> {
  // Do not enhance very short prompts.
  if (userInput.trim().split(' ').length < 3) {
    yield userInput;
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const metaPrompt = `
    You are a world-class prompt engineer AI. Your sole purpose is to take a user's raw idea and transform it into a highly detailed, specific, and effective prompt for a sophisticated agentic AI.

    Rules:
    - Expand on the original concept, adding rich detail, context, and clarity.
    - Anticipate implicit needs and make them explicit.
    - If the prompt is for an image or video, describe cinematic details like lighting, composition, and style.
    - If the prompt is for code, specify language, libraries, and expected output format.
    - If the prompt is a question, rephrase it to elicit a more comprehensive and well-structured answer.
    - CRITICAL: You must only return the enhanced prompt text itself. Do not include any preamble, explanation, or markdown formatting like "Enhanced Prompt:".

    ---
    Original User Prompt: "${userInput}"
    ---
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: metaPrompt,
        config: {
            temperature: 0.5, // Lower temperature for more focused enhancements
        }
    });

    let hasYielded = false;
    for await (const chunk of responseStream) {
      const chunkText = getText(chunk);
      if (chunkText) {
        hasYielded = true;
        yield chunkText;
      }
    }
    
    // If the stream completed but we never yielded any text, it's a failure.
    if (!hasYielded) {
      throw new Error("Model returned an empty enhancement stream.");
    }

  } catch (error) {
    const parsedError = parseApiError(error);
    console.error("Prompt enhancement stream failed:", parsedError);
    // Re-throw the error so the calling component can handle the failure state.
    throw new Error(`Prompt enhancement failed: ${parsedError.message}`);
  }
}