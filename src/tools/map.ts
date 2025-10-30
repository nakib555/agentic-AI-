/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";
import { ToolError } from '../../types';
import { getText } from '../utils/geminiUtils';

export const displayMapDeclaration: FunctionDeclaration = {
  name: 'displayMap',
  description: 'Displays an interactive map centered on a specific geographical location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      latitude: { type: Type.NUMBER, description: 'The latitude for the center of the map.' },
      longitude: { type: Type.NUMBER, description: 'The longitude for the center of the map.' },
      zoom: { type: Type.NUMBER, description: 'The zoom level of the map, from 1 (world) to 18 (street level). Default is 13.' },
      markerText: { type: Type.STRING, description: 'Optional text to display in a popup on a marker at the specified location.' }
    },
    required: ['latitude', 'longitude'],
  },
};

export const executeDisplayMap = (args: { latitude: number; longitude: number; zoom?: number, markerText?: string }): string => {
  const { latitude, longitude, zoom = 13, markerText } = args;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new ToolError('displayMap', 'INVALID_COORDINATES', 'Latitude and longitude must be numbers.');
  }

  const mapData = {
      latitude,
      longitude,
      zoom,
      markerText
  };

  return `[MAP_COMPONENT]${JSON.stringify(mapData)}[/MAP_COMPONENT]`;
};

export const analyzeMapVisuallyDeclaration: FunctionDeclaration = {
  name: 'analyzeMapVisually',
  description: 'Analyzes the map area at a given latitude and longitude and returns a textual description of visible landmarks, parks, and road layouts. Use this after displaying a map if you need to "see" what is on it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      latitude: { type: Type.NUMBER, description: 'The latitude of the map area to analyze.' },
      longitude: { type: Type.NUMBER, description: 'The longitude of the map area to analyze.' },
    },
    required: ['latitude', 'longitude'],
  },
};

export const executeAnalyzeMapVisually = async (args: { latitude: number, longitude: number }): Promise<string> => {
  const { latitude, longitude } = args;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new ToolError('analyzeMapVisually', 'INVALID_COORDINATES', 'Latitude and longitude must be numbers.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
      You are a cartography expert.
      Based on the geographical coordinates latitude=${latitude} and longitude=${longitude}, provide a concise, bulleted list describing the key landmarks, major roads, parks, and general layout of the immediate area.
      Focus on what would be visually prominent on a standard map view.
      Do not mention the coordinates in your response.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const description = getText(response);
    return `Visual analysis of the map at lat ${latitude.toFixed(4)}, lon ${longitude.toFixed(4)}:\n${description}`;

  } catch (err) {
    console.error("Visual map analysis tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during map analysis.";
    throw new ToolError('analyzeMapVisually', 'ANALYSIS_FAILED', errorMessage, err as Error);
  }
};