/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";
import { ToolError } from '../types';
import { getText } from '../utils/geminiUtils';

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

/**
 * A type guard to safely check if an object has a specific property.
 * @param obj The object to check.
 * @param prop The property key.
 * @returns True if the object has the property, false otherwise.
 */
function hasProperty<K extends PropertyKey>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

export const executeDuckDuckGoSearch = async (args: { query: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    let prompt: string;
    let isUrl = false;
    
    try {
      new URL(args.query);
      isUrl = true;
    } catch (_) {
      isUrl = false;
    }

    if (isUrl) {
      prompt = `Act as a research assistant. Analyze the content of the provided URL and generate a comprehensive, well-structured summary. Extract the key arguments, findings, and conclusions. The summary should be neutral and factual. URL: "${args.query}"`;
    } else {
      prompt = `You are a web research expert. Perform a web search to answer the following query comprehensively. Synthesize information from multiple sources to provide a detailed, accurate, and well-structured response. Query: "${args.query}"`;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Use response.text directly as per Gemini API guidelines for grounding responses.
    const summary = getText(response).trim() ?? '';
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // FIX: Add robust type guards to safely access nested properties on the 'unknown' chunk object.
    // This prevents runtime errors and satisfies TypeScript's type checking for the reported errors.
    const sources: { uri: string; title: string }[] = [];
    for (const chunk of groundingChunks) {
      // Safely check if 'chunk' is an object and has a 'web' property.
      if (!hasProperty(chunk, 'web')) {
        continue;
      }

      const web = chunk.web;
      // Safely check if the 'web' property is an object.
      if (typeof web !== 'object' || web === null) {
        continue;
      }

      // Safely check if the 'web' object has a 'uri' property that is a string.
      if (!hasProperty(web, 'uri') || typeof web.uri !== 'string') {
        continue;
      }

      const uri = web.uri;
      let title = uri; // Default title to URI

      // Safely check for an optional 'title' property that is a string.
      if (hasProperty(web, 'title') && typeof web.title === 'string' && web.title.trim()) {
          title = web.title.trim();
      }
      
      sources.push({ uri, title });
    }

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    
    if (isUrl) {
        const queryUrl = args.query;
        if (!uniqueSources.some(s => s.uri === queryUrl)) {
            uniqueSources.unshift({ uri: queryUrl, title: queryUrl });
        }
    }
    
    const sourcesMarkdown = uniqueSources
      .map(s => `- [${s.title}](${s.uri})`)
      .join('\n');
    
    return `Search successful. Here is a summary of the findings:\n\n${summary}\n\n[SOURCES_PILLS]\n${sourcesMarkdown}\n[/SOURCES_PILLS]`;
  } catch (err) {
    console.error("DuckDuckGo Search tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the search.";
    throw new ToolError('duckduckgoSearch', 'SEARCH_FAILED', errorMessage, err as Error);
  }
};