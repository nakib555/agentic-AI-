/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

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
      return 'Error: Latitude and longitude must be numbers.';
  }

  const mapData = {
      latitude,
      longitude,
      zoom,
      markerText
  };

  return `[MAP_COMPONENT]${JSON.stringify(mapData)}[/MAP_COMPONENT]`;
};