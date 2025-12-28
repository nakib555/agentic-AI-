
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { generateContentWithRetry } from "../utils/geminiUtils";

/**
 * Cleans text for Text-to-Speech by removing markdown, component tags, and excess whitespace.
 * The TTS model works best with plain, clean text.
 */
const cleanTextForTts = (text: string): string => {
    if (!text) return "";

    let cleanedText = text;

    // 1. Remove all specific UI component tags and their JSON content
    // We list them explicitly to avoid stripping unknown bracketed text that might be valid.
    const componentTags = [
        'VIDEO_COMPONENT', 'ONLINE_VIDEO_COMPONENT', 
        'IMAGE_COMPONENT', 'ONLINE_IMAGE_COMPONENT', 
        'MCQ_COMPONENT', 'MAP_COMPONENT', 
        'FILE_ATTACHMENT_COMPONENT', 'BROWSER_COMPONENT', 
        'CODE_OUTPUT_COMPONENT', 'VEO_API_KEY_SELECTION_COMPONENT',
        'LOCATION_PERMISSION_REQUEST', 'ARTIFACT_CODE', 'ARTIFACT_DATA'
    ];

    componentTags.forEach(tag => {
        const regex = new RegExp(`\\[${tag}\\][\\s\\S]*?\\[\\/${tag}\\]`, 'g');
        cleanedText = cleanedText.replace(regex, '');
    });
  
    // 2. Handle Code Blocks (```...```)
    // Replace with a spoken indicator instead of silence or reading code syntax.
    if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```[\s\S]*?```/g, ' ... [Code block] ... ');
    }
  
    // 3. Remove Display Math ($$...$$)
    cleanedText = cleanedText.replace(/\$\$[\s\S]*?\$\$/g, ' ... [Mathematical formula] ... ');

    // 4. Process Inline Math ($...$)
    cleanedText = cleanedText.replace(/\$([^$\n]+)\$/g, '$1');

    // 5. Clean Markdown Links & Images
    cleanedText = cleanedText.replace(/!\[(.*?)\]\(.*?\)/g, '$1'); // Images -> alt text
    cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links -> text
    
    // 6. Remove Raw URLs
    cleanedText = cleanedText.replace(/(https?:\/\/[^\s]+)/g, ' link ');

    // 7. Remove HTML Tags
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
  
    // 8. Markdown Structure to Punctuation (CRITICAL for Prosody)
    
    // Headers -> Period + Pause
    cleanedText = cleanedText.replace(/^#{1,6}\s+(.*)$/gm, '$1. '); 
    
    // Bold/Italic -> Just text
    cleanedText = cleanedText.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleanedText = cleanedText.replace(/(\*|_)(.*?)\1/g, '$2');
    cleanedText = cleanedText.replace(/~~(.*?)~~/g, '$1');
    
    // List Bullets -> Replace with comma or period for pause
    cleanedText = cleanedText.replace(/^\s*[-*+]\s+/gm, ', ');
    cleanedText = cleanedText.replace(/^\s*\d+\.\s+/gm, ', '); 
    
    // Blockquotes
    cleanedText = cleanedText.replace(/^>\s/gm, '');
    
    // Horizontal rules
    cleanedText = cleanedText.replace(/^-{3,}\s*$/gm, '. ');

    // 9. Consolidate Whitespace
    // Replace newlines with a period if the previous line didn't end in punctuation
    // This prevents "Header" and "Next Line" from merging into "HeaderNext Line"
    cleanedText = cleanedText.replace(/([^\.\!\?])\n+/g, '$1. ');
    
    // Collapse multiple spaces
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    // Fallback
    if (!cleanedText && text.length > 0) {
        return "I have generated the visual content you requested.";
    }
    
    return cleanedText;
};

// Known valid prebuilt voices for Gemini 2.5 TTS
const STANDARD_GEMINI_VOICES = new Set([
    'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 
    'Aoede', 'Hestia', 'Leda', 'Orpheus', 'Thalia'
]);

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string, model: string): Promise<string> => {
    try {
        const cleanedText = cleanTextForTts(text);
        
        if (!cleanedText) {
            throw new Error("No readable text found for speech synthesis.");
        }

        const targetModel = model || "gemini-2.5-flash-preview-tts";
        let targetVoice = voice || 'Puck';
        let promptText = cleanedText;

        // Handling Custom Accents / Personas not natively supported
        if (!STANDARD_GEMINI_VOICES.has(targetVoice)) {
            console.log(`[TTS] Custom accent requested: ${targetVoice}`);
            // Use Aoede as a neutral professional base
            const baseVoice = 'Aoede'; 
            
            // We prepend a system-like instruction to the text itself for the model to follow
            promptText = `(Speak in a ${targetVoice} accent) ${cleanedText}`;
            targetVoice = baseVoice;
        }

        console.log(`[TTS] Generating speech with model: ${targetModel}, voice: ${targetVoice}`);

        const response = await generateContentWithRetry(ai, {
            model: targetModel,
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: targetVoice } } },
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
            suggestion = "The response contains only visual elements and no text to read.";
        }

        throw new ToolError('textToSpeech', 'TTS_FAILED', message, originalError, suggestion);
    }
};
