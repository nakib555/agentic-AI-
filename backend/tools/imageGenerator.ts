/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ToolError } from "../utils/apiError";

const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const executeImageGenerator = async (ai: GoogleGenAI, args: { prompt: string, numberOfImages?: number, model: string, aspectRatio?: string }): Promise<string> => {
  const defaultAspectRatio = '16:9'; // Default for backend
  const { prompt, numberOfImages = 1, model, aspectRatio = defaultAspectRatio } = args;

  try {
    let base64ImageBytesArray: string[] = [];

    if (model === 'gemini-2.5-flash-image') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
             throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any images.');
        }

        for (const part of parts) {
            if (part.inlineData) base64ImageBytesArray.push(part.inlineData.data);
        }
    } else { // Assume Imagen model
        const count = Math.max(1, Math.min(5, Math.floor(numberOfImages)));
        const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
        const response = await ai.models.generateImages({
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
        base64ImageBytesArray = response.generatedImages.map(img => img.image.imageBytes);
    }

    if (base64ImageBytesArray.length === 0) {
        throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any image data.');
    }

    const results = base64ImageBytesArray.map((base64, i) => {
        // Since this is executed on the backend, we will return a data URL directly
        // for the frontend to render, bypassing the need for client-side IndexedDB for generated images.
        const imageData = {
            srcUrl: `data:image/png;base64,${base64}`,
            prompt: i > 0 ? `${prompt} (variation ${i + 1})` : prompt,
            alt: i > 0 ? `${prompt} (variation ${i + 1})` : prompt,
            // Provide a unique key for frontend editing purposes.
            editKey: `generated_${Date.now()}_${i}`
        };
        return `[IMAGE_COMPONENT]${JSON.stringify(imageData)}[/IMAGE_COMPONENT]`;
    });
    
    return `Successfully generated ${results.length} image(s).\n\n${results.join('\n')}`;

  } catch (err) {
    console.error("Image generation tool failed:", err);
    if (err instanceof ToolError) throw err;
    const originalError = err instanceof Error ? err : new Error("An unknown error occurred during image generation.");
    throw new ToolError('generateImage', 'GENERATION_FAILED', originalError.message, originalError);
  }
};