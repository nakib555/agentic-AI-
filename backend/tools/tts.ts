
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError.js";
import { generateContentWithRetry } from "../utils/geminiUtils.js";

const cleanTextForTts = (text: string): string => {
    let cleanedText = text.replace(/\[[A-Z_]+_COMPONENT\].*?\[\/\1_COMPONENT\]/gs, '');
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
    cleanedText = cleanedText
      .replace(/^#{1,6}\s/gm, '')
      .replace(/(\*\*|__|\*|_|==|~~)(.*?)\1/g, '$2')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^>\s/gm, '')
      .replace(/^-{3,}\s*$/gm, '')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText;
};

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string, model: string): Promise<string> => {
    try {
        const cleanedText = cleanTextForTts(text);
        if (!cleanedText) {
            throw new Error("No text to speak after cleaning.");
        }

        // Use the user-selected model, or fallback ONLY if not provided
        const targetModel = model || "gemini-2.5-flash-preview-tts";

        // Strictly use the SDK `generateContent` method with AUDIO modality
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
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
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
