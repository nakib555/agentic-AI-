/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculatorDeclaration, executeCalculator } from './calculator';
import { deepSearchDeclaration, executeDeepSearch } from './googleSearch';
import { createImageDeclaration, executeCreateImage } from './imageGenerator';
import { longRunningTaskDeclaration, executeLongRunningTask } from './longRunningTask';
import { realtimeSearchDeclaration, executeRealtimeSearch } from './realtimeSearch';
import { getCurrentLocationDeclaration, executeGetCurrentLocation } from './location';
import { getWeatherDeclaration, executeGetCurrentWeather } from './weather';


// Export all tool declarations for the model
export const toolDeclarations = [
  calculatorDeclaration,
  deepSearchDeclaration,
  realtimeSearchDeclaration,
  getCurrentLocationDeclaration,
  getWeatherDeclaration,
  createImageDeclaration,
  longRunningTaskDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'calculator': executeCalculator,
  'deepWebSearch': executeDeepSearch,
  'realtimeWebSearch': executeRealtimeSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'getCurrentWeather': executeGetCurrentWeather,
  'createImage': executeCreateImage,
  'longRunningTask': executeLongRunningTask,
};