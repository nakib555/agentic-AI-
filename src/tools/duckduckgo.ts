/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";

export const duckduckgoSearchDeclaration: FunctionDeclaration = {
  name: 'duckduckgoSearch',
  description: 'Dual-function tool. For general queries, it performs a web search. If the query provided is a valid URL, it will fetch and summarize the content of that specific webpage.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query or a URL to summarize.' },
    },
    required: ['query'],
  },
};

export const executeDuckDuckGoSearch = async (args: { query: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    let prompt: string;
    let isUrl = false;
    
    // Step 1: Determine if the query is a URL or a search term.
    try {
      new URL(args.query);
      isUrl = true;
    } catch (_) {
      isUrl = false;
    }

    // Step 2: Create a specific prompt for Gemini based on the query type.
    if (isUrl) {
      // If it's a URL, instruct the model to summarize its content.
      prompt = `Please provide a comprehensive summary of the content at the following URL: "${args.query}". Focus on the main points and key information.`;
    } else {
      // If it's a search term, ask for a standard web search answer.
      prompt = `Based on a web search, provide a comprehensive answer for the following query: "${args.query}"`;
    }
    
    // Step 3: Call the Gemini model with Google Search grounding enabled.
    // The grounding tool will fetch web content based on the prompt.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text ?? '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Step 4: Safely parse the grounding chunks to extract web sources.
    const sources = groundingChunks
      // FIX: Refactored the type guard to be more explicit and resolve TypeScript errors.
      .map((chunk: unknown) => {
        // Type guard to ensure the chunk structure is valid.
        if (
          chunk &&
          typeof chunk === 'object' &&
          'web' in chunk &&
          chunk.web &&
          typeof chunk.web === 'object' &&
          'uri' in chunk.web
        ) {
          const web = chunk.web as { uri: unknown; title?: unknown };
          if (typeof web.uri === 'string' && web.uri) {
            return {
              uri: web.uri,
              title:
                typeof web.title === 'string' && web.title.trim()
                  ? web.title.trim()
                  : web.uri,
            };
          }
        }
        return null;
      })
      .filter((source): source is { uri: string; title: string } => source !== null);

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    
    // Step 5: If the original query was a URL, ensure it's included as the primary source.
    if (isUrl) {
        const queryUrl = args.query;
        if (!uniqueSources.some(s => s.uri === queryUrl)) {
            uniqueSources.unshift({ uri: queryUrl, title: queryUrl });
        }
    }
    
    const sourcesMarkdown = uniqueSources
      .map(s => `- [${s.title}](${s.uri})`)
      .join('\n');
    
    // Step 6: Format the final result for the AI, including the summary and the sources component.
    return `Search successful. Here is a summary of the findings:\n\n${summary}\n\n[SOURCES_PILLS]\n${sourcesMarkdown}\n[/SOURCES_PILLS]`;
  } catch (err) {
    console.error("DuckDuckGo Search tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the search.";
    return `Error performing search: ${errorMessage}`;
  }
};
