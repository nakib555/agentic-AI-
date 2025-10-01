/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const createImageDeclaration: FunctionDeclaration = {
  name: 'createImage',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed, descriptive prompt to generate an image from.' },
    },
    required: ['prompt'],
  },
};

export const executeCreateImage = (args: { prompt: string }): string => {
  console.log(`Generating image for: ${args.prompt}`);
  // Simulate a validation error
  if (!args.prompt || args.prompt.length < 10) {
    throw new Error("Prompt is too short. Please provide a more detailed description for the image.");
  }
  // In a real app, you would make an API call to an image generation model.
  return `Successfully started image generation process for the prompt: "${args.prompt}". The image will be available shortly.`;
};