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
        description: 'Our most powerful reasoning model, which excels at coding and complex reasoning tasks.' 
    },
    { 
        id: 'gemini-flash-latest', 
        name: 'Gemini Flash Latest', 
        description: 'Points to gemini-2.5-flash-preview-09-2025. A hybrid reasoning model with a 1M token context window.'
    },
    { 
        id: 'gemini-flash-lite-latest', 
        name: 'Gemini Flash-Lite Latest', 
        description: 'Points to gemini-2.5-flash-lite-preview-09-2025. Our smallest and most cost effective model, built for at scale usage.'
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash', 
        description: 'Our hybrid reasoning model, with a 1M token context window and thinking budgets.'
    },
    { 
        id: 'gemini-2.5-flash-lite', 
        name: 'Gemini 2.5 Flash-Lite', 
        description: 'Our smallest and most cost effective model, built for at scale usage.'
    },
    { 
        id: 'gemini-2.0-flash', 
        name: 'Gemini 2.0 Flash', 
        description: 'Our most balanced multimodal model with great performance across all tasks.'
    },
    { 
        id: 'gemini-2.0-flash-lite', 
        name: 'Gemini 2.0 Flash-Lite', 
        description: 'Our smallest and most cost effective model, built for at scale usage.'
    },
    { 
        id: 'learnlm-2.0-flash-experimental', 
        name: 'LearnLM 2.0 Flash Experimental', 
        description: 'An experimental version of the LearnLM 2.0 Flash model.'
    },
    { 
        id: 'gemini-robotics-er-1.5-preview', 
        name: 'Gemini Robotics-ER 1.5 Preview', 
        description: 'A thinking model that enhances robots\' abilities to understand and interact with the physical world.'
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