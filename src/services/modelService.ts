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