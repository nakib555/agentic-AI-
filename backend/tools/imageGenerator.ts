
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { fileStore } from "../services/fileStore";
import { Buffer } from 'buffer';
import { generateContentWithRetry, generateImagesWithRetry } from "../utils/geminiUtils";

const generateOpenRouterImage = async (apiKey: string, args: any): Promise<string[]> => {
    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agentic-ai-chat.local",
            "X-Title": "Agentic AI Chat",
        },
        body: JSON.stringify({
            model: args.model,
            prompt: args.prompt,
            n: args.numberOfImages || 1,
            size: args.aspectRatio === '16:9' ? '1024x576' : '1024x1024', // Basic mapping, can be expanded
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Image API Error: ${errorText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.b64_json || item.url); // Use b64 if available
};

export const executeImageGenerator = async (
    ai: GoogleGenAI | null, // Made nullable for OpenRouter mode
    args: { prompt: string, numberOfImages?: number, model: string, aspectRatio?: string }, 
    chatId: string,
    provider: 'gemini' | 'openrouter' = 'gemini',
    apiKey: string // Needed for OpenRouter
): Promise<string> => {
  const defaultAspectRatio = '1:1';
  const { prompt, numberOfImages = 1, model, aspectRatio = defaultAspectRatio } = args;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ToolError('generateImage', 'INVALID_PROMPT', 'Prompt is empty or missing.', undefined, 'Please provide a descriptive prompt for the image.');
  }

  try {
    let base64ImageBytesArray: string[] = [];

    if (provider === 'openrouter') {
         if (!apiKey) throw new Error("OpenRouter API key is required for image generation.");
         base64ImageBytesArray = await generateOpenRouterImage(apiKey, args);
    } else {
        // Gemini Logic
        if (!ai) throw new Error("GoogleGenAI instance required for Gemini image generation.");

        if (model.includes('flash-image')) {
            // Nano Banana / Flash Image
            const response = await generateContentWithRetry(ai, {
                model: model,
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            const parts = response.candidates?.[0]?.content?.parts;
            if (!parts || parts.length === 0) {
                 const finishReason = response.candidates?.[0]?.finishReason;
                 if (finishReason === 'SAFETY') {
                     throw new ToolError('generateImage', 'SAFETY_BLOCK', 'Image generation was blocked by safety settings.');
                 }
                 throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'The model returned a response but no image data found.');
            }

            for (const part of parts) {
                if (part.inlineData?.data) {
                    base64ImageBytesArray.push(part.inlineData.data);
                }
            }
        } else { 
            // Imagen Model
            const count = Math.max(1, Math.min(4, Math.floor(numberOfImages)));
            const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
            
            const response = await generateImagesWithRetry(ai, {
                model: model,
                prompt: prompt,
                config: {
                  numberOfImages: count,
                  outputMimeType: 'image/png',
                  aspectRatio: validAspectRatios.includes(aspectRatio) ? aspectRatio : defaultAspectRatio,
                },
            });

            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any images.');
            }
            
            base64ImageBytesArray = response.generatedImages
                .map(img => img.image?.imageBytes)
                .filter((bytes): bytes is string => !!bytes);
        }
    }

    if (base64ImageBytesArray.length === 0) {
        throw new ToolError('generateImage', 'NO_DATA_EXTRACTED', 'Failed to extract image bytes from the response.');
    }

    const savedFilePaths: string[] = [];
    for (let i = 0; i < base64ImageBytesArray.length; i++) {
        // Handle URL vs Base64 from OpenRouter
        const rawData = base64ImageBytesArray[i];
        let buffer: Buffer;
        let ext = 'png';

        if (rawData.startsWith('http')) {
            // It's a URL, fetch it
            const imgRes = await fetch(rawData);
            const arrayBuf = await imgRes.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            // Try to deduce extension from content-type or url
            const contentType = imgRes.headers.get('content-type');
            if (contentType === 'image/jpeg') ext = 'jpg';
            if (contentType === 'image/webp') ext = 'webp';
        } else {
            // It's base64
            buffer = Buffer.from(rawData, 'base64');
        }

        const filename = `image_${Date.now()}_${i}.${ext}`;
        const virtualPath = `${filename}`; 
        await fileStore.saveFile(chatId, virtualPath, buffer);
        savedFilePaths.push(virtualPath);
    }
    
    return `Successfully generated ${savedFilePaths.length} image(s) using ${provider} (${model}) and saved to:\n- ${savedFilePaths.join('\n- ')}\n\n(Note: The image is saved. Use 'displayFile' if you want to show it.)`;

  } catch (err) {
    if (err instanceof ToolError) throw err;
    const originalError = err instanceof Error ? err : new Error(String(err));
    const msg = originalError.message || '';

    if (msg.includes('429') || msg.includes('quota')) {
        throw new ToolError('generateImage', 'QUOTA_EXCEEDED', 'Image generation quota exceeded.', originalError);
    }
    throw new ToolError('generateImage', 'GENERATION_FAILED', originalError.message, originalError);
  }
};
