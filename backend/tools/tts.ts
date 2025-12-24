
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError.js";
import { generateContentWithRetry } from "../utils/geminiUtils.js";

/**
 * Cleans text for Text-to-Speech by removing markdown, component tags, and excess whitespace.
 * The TTS model works best with plain, clean text.
 */
const cleanTextForTts = (text: string): string => {
    if (!text) return "";

    // Remove all component tags like [IMAGE_COMPONENT]...[/IMAGE_COMPONENT]
    let cleanedText = text.replace(/\[([A-Z_]+)_COMPONENT\].*?\[\/\1_COMPONENT\]/gs, '');
  
    // Remove code blocks
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
  
    // Simple markdown removal
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
    
    // Fallback if the cleaning removed everything (e.g., purely visual response)
    if (!cleanedText && text.length > 0) {
        return "I have generated the content you requested.";
    }
    
    return cleanedText;
};

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string, model: string): Promise<string> => {
    try {
        const cleanedText = cleanTextForTts(text);
        
        if (!cleanedText) {
            // Return a silent success (empty audio) or throw strictly?
            // Throwing allows the UI to show an error or disable the button.
            throw new Error("No readable text found for speech synthesis.");
        }

        // Use the model provided by the frontend request, or fallback to the standard TTS model
        const targetModel = model || "gemini-2.5-flash-preview-tts";

        // Use Modality.AUDIO enum as required by SDK
        const response = await generateContentWithRetry(ai, {
            model: targetModel,
            contents: [{ parts: [{ text: cleanedText }] }],
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Puck' } } },
            },
        });

        let base64Audio: string | undefined;
        if (response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            if (content && content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/') && part.inlineData.data) {
                        base64Audio = part.inlineData.data;
                        break;
                    }
                }
            }
        }
        
        if (base64Audio) {
            return base64Audio;
        } else {
            console.error("TTS Response missing audio data:", JSON.stringify(response, null, 2));
            throw new Error("No audio data returned from TTS model.");
        }
    } catch (err: any) {
        console.error("TTS tool failed:", err);
        const originalError = err instanceof Error ? err : new Error("An unknown error occurred during TTS generation.");
        
        let message = originalError.message;
        let suggestion = "Please try again later or select a different voice.";

        if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
            suggestion = "The text-to-speech quota has been exceeded. Please check your billing or wait a few minutes.";
        } else if (message.includes('400') || message.includes('INVALID_ARGUMENT')) {
            suggestion = "The text provided might be too long or contain characters not supported by the audio model.";
        } else if (message.includes('safety') || message.includes('blocked')) {
            suggestion = "The generated audio was blocked by safety settings.";
        } else if (message.includes('No readable text')) {
            suggestion = "The response contains only visual elements (images, maps) and no text to read.";
        }

        throw new ToolError('textToSpeech', 'TTS_FAILED', message, originalError, suggestion);
    }
};
