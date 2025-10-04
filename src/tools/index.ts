/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { googleSearchDeclaration, executeGoogleSearch } from './googleSearch';
import { longRunningTaskDeclaration, executeLongRunningTask } from './longRunningTask';
import { getCurrentLocationDeclaration, executeGetCurrentLocation } from './location';
import { getWeatherDeclaration, executeGetCurrentWeather } from './weather';
import { mapDeclaration, executeMap } from './map';


// Export all tool declarations for the model
export const toolDeclarations = [
  googleSearchDeclaration,
  getCurrentLocationDeclaration,
  getWeatherDeclaration,
  longRunningTaskDeclaration,
  mapDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'googleSearch': executeGoogleSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'getCurrentWeather': executeGetCurrentWeather,
  'longRunningTask': executeLongRunningTask,
  'map': executeMap,
};
