/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const realtimeSearchDeclaration: FunctionDeclaration = {
  name: 'realtimeWebSearch',
  description: 'Searches the web for the latest, up-to-the-minute information on news, events, or trending topics.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The query to search for real-time information.' },
    },
    required: ['query'],
  },
};

export const executeRealtimeSearch = (args: { query: string }): string => {
  console.log(`Performing real-time search for: ${args.query}`);
  const lowerCaseQuery = args.query.toLowerCase();

  if (lowerCaseQuery.includes('formula 1') || lowerCaseQuery.includes('f1')) {
    return `
## Latest F1 News (Real-time)

**Breaking:** Sources report that a major team is announcing a surprise driver swap for the upcoming season. Official announcements are expected within the hour.

**Current Standings:** After the last race, Max Verstappen leads the driver's championship by 12 points.
    `;
  }

  return `No real-time results found for "${args.query}". Try a deep web search instead.`;
};