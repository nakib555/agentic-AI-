/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Model = {
  id: string;
  name: string;
  description: string;
};

const mockModels: Model[] = [
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
    { 
        id: 'gemini-2.0-pro', 
        name: 'Gemini 2.0 Pro', 
        description: 'A powerful, previous-generation model for a wide range of advanced tasks.' 
    },
    { 
        id: 'gemini-2.0-flash', 
        name: 'Gemini 2.0 Flash', 
        description: 'A fast and cost-effective previous-generation model for high-frequency applications.'
    },
];

/**
 * Simulates fetching the available AI models from a backend.
 */
export const getAvailableModels = (): Promise<Model[]> => {
    return new Promise((resolve) => {
        // Simulate a network delay of 1 second
        setTimeout(() => {
            resolve(mockModels);
        }, 1000);
    });
};