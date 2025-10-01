/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const deepSearchDeclaration: FunctionDeclaration = {
  name: 'deepWebSearch',
  description: 'Performs a deep, comprehensive search on a topic. Use for historical facts, detailed explanations, or non-time-sensitive queries.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The query to search the web for. Used for "Deep Research".' },
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
  `
};

export const executeDeepSearch = (args: { query: string }): string => {
  console.log(`Performing deep search for: ${args.query}`);
  const lowerCaseQuery = args.query.toLowerCase();
  
  // Simulate a network failure for demonstration
  if (lowerCaseQuery.includes('fail network search')) {
    throw new Error("Unable to connect to Deep Search due to a network issue.");
  }

  // Use more robust matching to find the correct result.
  if (lowerCaseQuery.includes('capital of france') || lowerCaseQuery.includes('france capital')) {
    return searchDatabase['capital of france'];
  }
  if (lowerCaseQuery.includes('formula 1') || lowerCaseQuery.includes('f1')) {
    return searchDatabase['formula 1'];
  }

  // Fallback for unmatched queries
  return `No search results found for "${args.query}". Please try a different query.`;
};