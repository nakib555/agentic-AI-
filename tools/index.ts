/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { duckduckgoSearchDeclaration, executeDuckDuckGoSearch } from './duckduckgo';
import { getCurrentLocationDeclaration, executeGetCurrentLocation, requestLocationPermissionDeclaration, executeRequestLocationPermission } from './location';
import { getWeatherDeclaration, executeGetCurrentWeather } from './weather';
import { imageGeneratorDeclaration, executeImageGenerator } from './imageGenerator';
import { videoGeneratorDeclaration, executeVideoGenerator } from './videoGenerator';
import { codeExecutorDeclaration, executeCode } from './codeExecutor';
import { calculatorDeclaration, executeCalculator } from './calculator';
import { displayMapDeclaration, executeDisplayMap } from './map';


// Export all tool declarations for the model
export const toolDeclarations = [
  duckduckgoSearchDeclaration,
  getCurrentLocationDeclaration,
  getWeatherDeclaration,
  imageGeneratorDeclaration,
  videoGeneratorDeclaration,
  codeExecutorDeclaration,
  calculatorDeclaration,
  displayMapDeclaration,
  requestLocationPermissionDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'duckduckgoSearch': executeDuckDuckGoSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'getCurrentWeather': executeGetCurrentWeather,
  'generateImage': executeImageGenerator,
  'generateVideo': executeVideoGenerator,
  'executeCode': executeCode,
  'calculator': executeCalculator,
  'displayMap': executeDisplayMap,
  'requestLocationPermission': executeRequestLocationPermission,
};