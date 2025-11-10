/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI, Modality } from "@google/genai";
import { fileStore } from '../services/fileStore';
import { ToolError } from '../types';
import { getText } from '../utils/geminiUtils';
import { parseApiError } from '../services/gemini/index';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};


export const imageGeneratorDeclaration: FunctionDeclaration = {
  name: 'generateImage',
  description: 'Generates one or more images based on a textual description. Use for creating static visual content like photos, illustrations, and graphics.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' },
      numberOfImages: { type: Type.NUMBER, description: 'The number of images to generate. Must be between 1 and 5. Defaults to 1. This is only supported by Imagen models.'},
      aspectRatio: { type: Type.STRING, description: 'The aspect ratio for the image. Supported for Imagen models: "1:1", "3:4", "4:3", "9:16", "16:9". Defaults to a responsive ratio (9:16 on mobile, 16:9 on desktop).' },
    },
    required: ['prompt'],
  },
};

export const executeImageGenerator = async (args: { prompt: string, numberOfImages?: number, model: string, aspectRatio?: string }): Promise<string> => {
    const isDesktop = window.innerWidth >= 768;
    const defaultAspectRatio = isDesktop ? '16:9' : '9:16';
    const { prompt, numberOfImages = 1, model, aspectRatio = defaultAspectRatio } = args;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    let base64ImageBytesArray: string[] = [];

    if (model === 'gemini-2.5-flash-image') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content?.parts) {
             throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any images.', undefined, "The model didn't return an image. This could be due to a safety policy violation or a problem with the prompt. Try rephrasing your prompt to be more descriptive.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64ImageBytesArray.push(part.inlineData.data);
            }
        }
    } else { // Assume Imagen model
        const count = Math.max(1, Math.min(5, Math.floor(numberOfImages))); // Clamp between 1 and 5
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
            throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any images.', undefined, "The model didn't return an image. This could be due to a safety policy violation or a problem with the prompt. Try rephrasing your prompt to be more descriptive.");
        }

        base64ImageBytesArray = response.generatedImages.map(img => img.image.imageBytes);
    }

    if (base64ImageBytesArray.length === 0) {
        throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return any image data.', undefined, "The model didn't return an image. This could be due to a safety policy violation or a problem with the prompt. Try rephrasing your prompt to be more descriptive.");
    }


    const savedFilePaths: string[] = [];
    for (const base64ImageBytes of base64ImageBytesArray) {
        const imageBlob = base64ToBlob(base64ImageBytes, 'image/png');
        const filename = `/main/output/image-${generateId()}.png`;
        await fileStore.saveFile(filename, imageBlob);
        savedFilePaths.push(filename);
    }
    
    if (savedFilePaths.length === 1) {
        return `Image successfully generated and saved to virtual filesystem at: ${savedFilePaths[0]}. You can now use tools like 'displayFile' to show it to the user.`;
    }
    
    return `${savedFilePaths.length} images successfully generated and saved to virtual filesystem at:\n- ${savedFilePaths.join('\n- ')}\nYou should now use the 'displayFile' tool for each path to show them to the user.`;

  } catch (err) {
    console.error("Image generation tool failed:", err instanceof Error ? err : JSON.stringify(err));
    if (err instanceof ToolError) throw err;
    const originalError = err instanceof Error ? err : new Error("An unknown error occurred during image generation.");
    throw new ToolError('generateImage', 'GENERATION_FAILED', originalError.message, originalError, "The image generation service failed. This might be a temporary issue. Please try again in a moment.");
  }
};