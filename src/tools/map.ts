/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const mapDeclaration: FunctionDeclaration = {
  name: 'map',
  description: 'Displays an interactive map. Can show a single location or directions between two points.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      destination: { type: Type.STRING, description: 'The destination location, address, or landmark to display on the map, e.g., "Eiffel Tower, Paris".' },
      origin: { type: Type.STRING, description: 'Optional. The starting point for directions, e.g., "Louvre Museum, Paris". If omitted, the map will just show the destination.' },
    },
    required: ['destination'],
  },
};

export const executeMap = (args: { destination: string; origin?: string }): string => {
    // Return a JSON string that the frontend can parse to render a map component.
    // This avoids returning raw HTML and allows for a richer, interactive component.
    return JSON.stringify({
        destination: args.destination,
        origin: args.origin,
    });
};
