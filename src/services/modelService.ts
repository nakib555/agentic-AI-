/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Model = {
  id: string;
  name: string;
  description: string;
};

export const validModels: Model[] = [
    { 
        id: 'gemini-2.5-pro', 
        name: 'Gemini 2.5 Pro', 
        description: 'The most capable Gemini model for complex reasoning, coding, and creative tasks.' 
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash', 
        description: 'A fast and efficient model, balanced for performance and cost across a wide range of tasks.'
    },
];

export const validImageModels: Model[] = [
    { 
        id: 'imagen-4.0-generate-001', 
        name: 'Imagen 4', 
        description: 'Highest quality image generation.' 
    },
    { 
        id: 'gemini-2.5-flash-image', 
        name: 'Gemini 2.5 Flash Image', 
        description: 'Fast, general-purpose image generation and editing.'
    }
];

export const validVideoModels: Model[] = [
    { 
        id: 'veo-3.1-fast-generate-preview', 
        name: 'Veo 3.1 Fast', 
        description: 'General video generation tasks.' 
    },
    { 
        id: 'veo-3.1-generate-preview', 
        name: 'Veo 3.1', 
        description: 'High-quality video generation and editing.' 
    }
];

/**
 * Simulates fetching the available AI models from a backend.
 */
export const getAvailableModels = (): Promise<Model[]> => {
    return new Promise((resolve) => {
        // Simulate a network delay of 1 second
        setTimeout(() => {
            resolve(validModels);
        }, 1000);
    });
};