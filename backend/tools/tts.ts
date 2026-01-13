
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { generateContentWithRetry } from "../utils/geminiUtils";
import { Buffer } from 'buffer';

/**
 * Cleans text for Text-to-Speech by removing markdown, component tags, and excess whitespace.
 * The TTS model works best with plain, clean text.
 */
const cleanTextForTts = (text: string): string => {
    if (!text) return "";

    let cleanedText = text;

    // 1. Remove all specific UI component tags and their JSON content
    const componentTags = [
        'VIDEO_COMPONENT', 'ONLINE_VIDEO_COMPONENT', 
        'IMAGE_COMPONENT', 'ONLINE_IMAGE_COMPONENT', 
        'MCQ_COMPONENT', 'MAP_COMPONENT', 
        'FILE_ATTACHMENT_COMPONENT', 'BROWSER_COMPONENT', 
        'CODE_OUTPUT_COMPONENT', 'VEO_API_KEY_SELECTION_COMPONENT',
        'LOCATION_PERMISSION_REQUEST'
    ];

    componentTags.forEach(tag => {
        const regex = new RegExp(`\\[${tag}\\][\\s\\S]*?\\[\\/${tag}\\]`, 'g');
        cleanedText = cleanedText.replace(regex, '');
    });
  
    // 2. Handle Code Blocks
    if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```[\s\S]*?```/g, ' . Code block omitted. ');
    }
  
    // 3. Remove Math
    cleanedText = cleanedText.replace(/\$\$[\s\S]*?\$\$/g, ' a mathematical formula ');
    cleanedText = cleanedText.replace(/\$([^$\n]+\$)/g, '$1');

    // 4. Clean Markdown Links & Images
    cleanedText = cleanedText.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
    cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    
    // 5. Remove Raw URLs
    cleanedText = cleanedText.replace(/(https?:\/\/[^\s]+)/g, ' link ');

    // 6. Remove HTML Tags
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
  
    // 7. Standard Markdown Symbol Removal
    cleanedText = cleanedText
      .replace(/^#{1,6}\s/gm, '') 
      .replace(/(\*\*|__)(.*?)\1/g, '$2') 
      .replace(/(\*|_)(.*?)\1/g, '$2') 
      .replace(/~~(.*?)~~/g, '$1') 
      .replace(/==(.*?)==/g, '$1') 
      .replace(/`([^`]+)`/g, '$1') 
      .replace(/^>\s/gm, '') 
      .replace(/^-{3,}\s*$/gm, '') 
      .replace(/^\s*[-*+]\s/gm, '') 
      .replace(/^\s*\d+\.\s/gm, ''); 
  
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    if (!cleanedText && text.length > 0) {
        return "I have generated the visual content you requested.";
    }
    
    return cleanedText;
};

// Known valid prebuilt voices for Gemini 2.5 TTS
const STANDARD_GEMINI_VOICES = new Set([
    'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
]);

export const executeOpenRouterTTS = async (apiKey: string, args: { text: string, voice?: string, model?: string }): Promise<string> => {
    const cleanedText = cleanTextForTts(args.text);
    if (!cleanedText) throw new Error("No readable text found.");

    // Default to a common OpenAI TTS model if none specified
    const model = args.model || 'openai/tts-1';
    // Map our internal voice names to OpenAI standards if needed, or pass through
    // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer.
    // If user selected a Gemini voice (Puck), map it to something similar or default.
    let voice = (args.voice || 'alloy').toLowerCase();
    const voiceMap: Record<string, string> = {
        'puck': 'alloy', 'charon': 'onyx', 'kore': 'nova', 'fenrir': 'echo', 'zephyr': 'shimmer'
    };
    if (voiceMap[voice]) voice = voiceMap[voice];

    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
         method: "POST",
         headers: {
             "Authorization": `Bearer ${apiKey}`,
             "Content-Type": "application/json",
             "HTTP-Referer": "https://agentic-ai-chat.local",
             "X-Title": "Agentic AI Chat",
         },
         body: JSON.stringify({
             model: model,
             input: cleanedText,
             voice: voice
         })
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
};

export const executeTextToSpeech = async (ai: GoogleGenAI, text: string, voice: string, model: string): Promise<string> => {
    try {
        const cleanedText = cleanTextForTts(text);
        
        if (!cleanedText) {
            throw new Error("No readable text found for speech synthesis.");
        }

        const targetModel = model || "gemini-2.5-flash-preview-tts";
        let targetVoice = voice || 'Puck';
        let promptText = cleanedText;

        if (!STANDARD_GEMINI_VOICES.has(targetVoice)) {
            const baseVoice = 'Zephyr'; 
            promptText = `Speak the following text exactly as a native ${targetVoice} speaker would, with authentic intonation and accent: "${cleanedText}"`;
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

        if (message.includes('429') || message.includes('quota')) {
            suggestion = "The text-to-speech quota has been exceeded.";
        }
        throw new ToolError('textToSpeech', 'TTS_FAILED', message, originalError, suggestion);
    }
};
