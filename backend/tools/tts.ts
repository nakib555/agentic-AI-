/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../../src/types";

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
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