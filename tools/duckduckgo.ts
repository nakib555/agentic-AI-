/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";

export const duckduckgoSearchDeclaration: FunctionDeclaration = {
  name: 'duckduckgoSearch',
  description: 'Performs a web search. Use for general queries, facts, and up-to-date information. Can also summarize a URL if the query is a valid URL.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The query to search the web for, or a URL to summarize.' },
    },
    required: ['query'],
  },
};

export const executeDuckDuckGoSearch = async (args: { query: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    let prompt: string;
    let isUrl = false;
    try {
      // Basic check to see if the query is a URL.
      new URL(args.query);
      isUrl = true;
    } catch (_) {
      isUrl = false;
    }

    if (isUrl) {
      prompt = `Please provide a comprehensive summary of the content at the following URL: "${args.query}". Focus on the main points and key information.`;
    } else {
      prompt = `Based on a web search, provide a comprehensive answer for the following query: "${args.query}"`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text ?? '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks
      .map(chunk => chunk.web && ({ uri: chunk.web.uri, title: chunk.web.title }))
      // FIX: Corrected the type predicate to match the parameter's type, resolving the TypeScript error.
      .filter((source): source is { uri: string, title: string } => Boolean(source && source.uri));

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
      
    const displaySources = [...uniqueSources];
    
    // If the original query was a URL, ensure it is included as the primary source.
    if (isUrl) {
        const queryUrl = args.query;
        if (!displaySources.some(s => s.uri === queryUrl)) {
            // Add it to the beginning of the list for prominence.
            displaySources.unshift({ uri: queryUrl, title: queryUrl });
        }
    }
    
    const sourcesMarkdown = displaySources
      .map(s => `- [${s.title || s.uri}](${s.uri})`)
      .join('\n');
    
    // This is the string that the AI will receive as the tool's output.
    // It contains the summary for the AI to process and a component tag for the AI to pass through to the UI.
    return `Search successful. Here is a summary of the findings:\n\n${summary}\n\n[SOURCES_PILLS]\n${sourcesMarkdown}\n[/SOURCES_PILLS]`;
  } catch (err) {
    console.error("DuckDuckGo Search tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the search.";
    return `Error performing search: ${errorMessage}`;
  }
};