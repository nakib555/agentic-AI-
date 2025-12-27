/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError.ts";
import { fileStore } from "../services/fileStore.ts";
import { Buffer } from 'buffer';
import { generateContentWithRetry, generateImagesWithRetry } from "../utils/geminiUtils.ts";

export const executeImageGenerator = async (ai: GoogleGenAI, args: { prompt: string, numberOfImages?: number, model: string, aspectRatio?: string }, chatId: string): Promise<string> => {
  const defaultAspectRatio = '1:1';
  const { prompt, numberOfImages = 1, model, aspectRatio = defaultAspectRatio } = args;

  try {
    let base64ImageBytesArray: string[] = [];

    if (model.includes('flash-image')) {
        const response = await generateContentWithRetry(ai, {
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
             throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any images.');
        }

        for (const part of parts) {
            if (part.inlineData?.data) {
                base64ImageBytesArray.push(part.inlineData.data);
            }
        }
    } else { // Assume Imagen model
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
        
        // Filter out undefined bytes
        base64ImageBytesArray = response.generatedImages
            .map(img => img.image?.imageBytes)
            .filter((bytes): bytes is string => !!bytes);
    }

    if (base64ImageBytesArray.length === 0) {
        throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any image data.');
    }

    const savedFilePaths: string[] = [];
    for (let i = 0; i < base64ImageBytesArray.length; i++) {
        const base64 = base64ImageBytesArray[i];
        const filename = `image_${Date.now()}_${i}.png`;
        const virtualPath = `${filename}`; // Save at the root of the chat's folder
        const buffer = Buffer.from(base64, 'base64');
        await fileStore.saveFile(chatId, virtualPath, buffer);
        savedFilePaths.push(virtualPath);
    }
    
    return `Successfully generated ${savedFilePaths.length} image(s) and saved to the following paths:\n- ${savedFilePaths.join('\n- ')}\n\nYou should now use the 'displayFile' tool to show the user the image(s).`;

  } catch (err) {
    console.error("Image generation tool failed:", err);
    if (err instanceof ToolError) throw err;
    const originalError = err instanceof Error ? err : new Error("An unknown error occurred during image generation.");
    throw new ToolError('generateImage', 'GENERATION_FAILED', originalError.message, originalError);
  }
};