/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const googleSearchDeclaration: FunctionDeclaration = {
  name: 'googleSearch',
  description: 'Performs a comprehensive search on a topic. Use for historical facts, detailed explanations, real-time news, or current events.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The query to search the web for.' },
    },
    required: ['query'],
  },
};

// Mock database for more realistic search results
const searchDatabase: { [key: string]: string } = {
  'capital of france': `
## Search Results for "capital of France"

### Paris - Wikipedia
**Paris** is the capital and most populous city of France. It is an important center of finance, diplomacy, commerce, fashion, gastronomy, science, and arts in Europe.
  `,
  'formula 1': `
## Search Results for "Formula 1"

### Formula 1 World Champions - Wikipedia
The **FIA Formula One World Championship** is the highest class of international racing for open-wheel single-seater formula racing cars. The reigning champion is **Max Verstappen**.

### Recent F1 News - Motorsport.com
Max Verstappen secured his third consecutive world title during the 2023 season, dominating the field with a record-breaking number of wins.

*   **2023 Champion:** Max Verstappen
*   **Team:** Red Bull Racing
  `,
  'latest formula 1 news': `
## Latest F1 News (Real-time)

**Breaking:** Sources report that a major team is announcing a surprise driver swap for the upcoming season. Official announcements are expected within the hour.

**Current Standings:** After the last race, Max Verstappen leads the driver's championship by 12 points.
    `
};

export const executeGoogleSearch = (args: { query: string }): string => {
  console.log(`Performing Google search for: ${args.query}`);
  const lowerCaseQuery = args.query.toLowerCase();
  
  // Simulate a network failure for demonstration
  if (lowerCaseQuery.includes('fail network search')) {
    throw new Error("Unable to connect to Google Search due to a network issue.");
  }

  // Use more robust matching to find the correct result.
  if (lowerCaseQuery.includes('capital of france') || lowerCaseQuery.includes('france capital')) {
    return searchDatabase['capital of france'];
  }
  if (lowerCaseQuery.includes('latest formula 1') || lowerCaseQuery.includes('f1 news')) {
      return searchDatabase['latest formula 1 news'];
  }
  if (lowerCaseQuery.includes('formula 1') || lowerCaseQuery.includes('f1')) {
    return searchDatabase['formula 1'];
  }

  // Fallback for unmatched queries
  return `No search results found for "${args.query}". Please try a different query.`;
};
