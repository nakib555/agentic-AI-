
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError.js";
import { generateContentWithRetry } from "../utils/geminiUtils.js";

/**
 * Cleans text for Text-to-Speech by removing markdown, component tags, and excess whitespace.
 * The TTS model works best with plain, clean text.
 */
const cleanTextForTts = (text: string): string => {
    // Remove all component tags like [IMAGE_COMPONENT]...[/IMAGE_COMPONENT]
    // Fix: Added capturing group ([A-Z_]+) so \1 works
    let cleanedText = text.replace(/\[([A-Z_]+)_COMPONENT\].*?\[\/\1_COMPONENT\]/gs, '');
  
    // Remove code blocks
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
  
    // Simple markdown removal - simplified regex to avoid potential backreference issues in strict mode
    cleanedText = cleanedText
      .replace(/^#{1,6}\s/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/__(.*?)__/g, '$1') // Underline
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/_(.*?)_/g, '$1') // Italic
      .replace(/==(.*?)==/g, '$1') // Highlight
      .replace(/~~(.*?)~~/g, '$1') // Strikethrough
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // Images
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/^>\s/gm, '') // Blockquotes
      .replace(/^-{3,}\s*$/gm, '') // Horizontal rules
      .replace(/^\s*[-*+]\s/gm, '') // List items
      .replace(/^\s*\d+\.\s/gm, ''); // Numbered list items
  
    // Collapse multiple newlines/spaces to a single space and trim
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    return cleanedText;
};

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string, model: string): Promise<string> => {
    try {
        const cleanedText = cleanTextForTts(text);
        if (!cleanedText) {
            throw new Error("No text to speak after cleaning.");
        }

        // Use the model provided by the frontend request, or fallback to the standard TTS model
        const targetModel = model || "gemini-2.5-flash-preview-tts";

        const response = await generateContentWithRetry(ai, {
            model: targetModel,
            contents: [{ parts: [{ text: cleanedText }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
        });

        let base64Audio: string | undefined;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                // Strict check for inlineData properties to satisfy TypeScript
                if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/') && part.inlineData.data) {
                    base64Audio = part.inlineData.data;
                    break;
                }
            }
        }
        
        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("No audio data returned from TTS model.");
        }
    } catch (err) {
        console.error("TTS tool failed:", err);
        const originalError = err instanceof Error ? err : new Error("An unknown error occurred during TTS generation.");
        throw new ToolError('textToSpeech', 'TTS_FAILED', originalError.message, originalError);
    }
};
