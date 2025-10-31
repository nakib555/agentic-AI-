/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI, Modality } from "@google/genai";
import { imageStore } from '../services/imageStore';
import { ToolError } from '../types';
import { getText } from '../utils/geminiUtils';

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
  description: 'Generates an image based on a textual description. Use for creating static visual content like photos, illustrations, and graphics.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' },
    },
    required: ['prompt'],
  },
};

export const executeImageGenerator = async (args: { prompt: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // 1. Enhance the user's prompt for better image quality
    const enhancementPrompt = `
      You are an expert prompt engineer for an advanced text-to-image model.
      Your task is to take a user's simple prompt and transform it into a rich, detailed, and visually evocative masterpiece.
      The enhanced prompt must be a single, fluent paragraph, suitable for direct input into an image generation model.

      Incorporate the following artistic concepts into your enhancement:
      - **Luminous ✨**: Emphasize light, radiance, and clarity.
      - **Elegant 💎**: Focus on refined, stylish, and graceful compositions.
      - **Polished 🪞**: Describe a flawless, carefully crafted, and high-fidelity scene.
      - **Fluent 🌊**: Create a sense of smooth, natural, and flowing movement or form.
      - **Refined 🕊️**: Ensure the details are sophisticated and precise.

      ---
      Original User Prompt: "${args.prompt}"
      ---

      Enhanced Prompt:
    `;

    const enhancementResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: enhancementPrompt,
    });
    
    const enhancedPrompt = getText(enhancementResponse).trim();

    // 2. Generate a short caption from the enhanced prompt
    const captionPrompt = `Based on the following detailed image prompt, create a single, short, elegant, one-sentence caption.

    Prompt: "${enhancedPrompt}"
    
    Caption:`;

    const captionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: captionPrompt,
    });
    // Clean up any quotes the model might add around the caption
    const caption = getText(captionResponse).trim().replace(/^["']|["']$/g, '');

    // 3. Generate the image using the enhanced prompt with gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: enhancedPrompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // 4. Parse the response to find the image data
    let base64ImageBytes: string | undefined;
    let mimeType = 'image/png'; // Default mimeType

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                base64ImageBytes = part.inlineData.data;
                mimeType = part.inlineData.mimeType;
                break; // Found the image, stop looking
            }
        }
    }

    if (!base64ImageBytes) {
        throw new ToolError('generateImage', 'NO_IMAGE_RETURNED', 'Image generation failed. The model did not return an image.');
    }
    
    // 5. Convert to blob and save to IndexedDB
    const imageBlob = base64ToBlob(base64ImageBytes, mimeType);
    const imageKey = await imageStore.saveImage(imageBlob);
    
    const imageData = {
        imageKey: imageKey,
        prompt: enhancedPrompt, // Return the enhanced prompt for the title tooltip
        caption: caption, // Return the short caption for display
    };

    // Return a component tag with a reference (key) instead of the full base64 data.
    return `[IMAGE_COMPONENT]${JSON.stringify(imageData)}[/IMAGE_COMPONENT]`;
  } catch (err) {
    console.error("Image generation tool failed:", err);
    if (err instanceof ToolError) throw err;
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
    throw new ToolError('generateImage', 'GENERATION_FAILED', errorMessage, err as Error);
  }
};