/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const getWeatherDeclaration: FunctionDeclaration = {
  name: 'getCurrentWeather',
  description: 'Gets the current weather for a specific location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'The city and state, e.g., "San Francisco, CA"' },
    },
    required: ['location'],
  },
};

export const executeGetCurrentWeather = (args: { location: string }): string => {
    const { location } = args;
    const lowerCaseLocation = location.toLowerCase();

    if (lowerCaseLocation.includes('tokyo')) {
        return `The weather in Tokyo is currently 26°C, sunny with a light breeze. ☀️`;
    }
    if (lowerCaseLocation.includes('london')) {
        return `The weather in London is currently 18°C and cloudy. Expect light showers later today. ☁️`;
    }
    if (lowerCaseLocation.includes('new york')) {
        return `The weather in New York is 22°C with clear skies. Perfect weather for a walk in the park. ✨`;
    }
    if (lowerCaseLocation.includes('error')) {
        throw new Error(`Could not retrieve weather for ${location} due to an API connection issue.`);
    }

    return `I'm sorry, I don't have weather information for "${location}". Please try a major city.`;
};