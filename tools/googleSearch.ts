/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";

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

export const executeGoogleSearch = async (args: { query: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // The prompt is crucial. It guides the model to use the search results to formulate a direct answer.
    const prompt = `Based on a web search, provide a comprehensive answer for the following query: "${args.query}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks
      .map(chunk => chunk.web && ({ uri: chunk.web.uri, title: chunk.web.title }))
      .filter((source): source is { uri: string, title: string } => Boolean(source && source.uri && source.title));

    // Deduplicate sources based on URI to avoid showing the same link multiple times.
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
      
    const resultData = {
      query: args.query,
      summary: summary,
      sources: uniqueSources,
    };

    // This special string will be parsed by the UI to render the search results component.
    return `[GOOGLE_SEARCH_RESULTS]${JSON.stringify(resultData)}[/GOOGLE_SEARCH_RESULTS]`;
  } catch (err) {
    console.error("Google Search tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the search.";
    return `Error performing search: ${errorMessage}`;
  }
};