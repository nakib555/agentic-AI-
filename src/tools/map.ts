/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../types';

// Declarations are now in `declarations.ts`

export const executeDisplayMap = (args: { latitude: number; longitude: number; zoom?: number, markerText?: string }): string => {
  const { latitude, longitude, zoom = 13, markerText } = args;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new ToolError('displayMap', 'INVALID_COORDINATES', 'Latitude and longitude must be numbers.', undefined, "The AI provided invalid coordinates (latitude/longitude). This can happen if it fails to find a location. Try rephrasing your request to be more specific.");
  }

  const mapData = {
      latitude,
      longitude,
      zoom,
      markerText
  };

  return `[MAP_COMPONENT]${JSON.stringify(mapData)}[/MAP_COMPONENT]`;
};