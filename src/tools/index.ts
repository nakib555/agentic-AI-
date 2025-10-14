/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { googleSearchDeclaration, executeGoogleSearch } from './googleSearch';
import { getCurrentLocationDeclaration, executeGetCurrentLocation } from './location';
import { getWeatherDeclaration, executeGetCurrentWeather } from './weather';
import { imageGeneratorDeclaration, executeImageGenerator } from './imageGenerator';
import { videoGeneratorDeclaration, executeVideoGenerator } from './videoGenerator';
import { codeExecutorDeclaration, executeCode } from './codeExecutor';
import { calculatorDeclaration, executeCalculator } from './calculator';


// Export all tool declarations for the model
export const toolDeclarations = [
  googleSearchDeclaration,
  getCurrentLocationDeclaration,
  getWeatherDeclaration,
  imageGeneratorDeclaration,
  videoGeneratorDeclaration,
  codeExecutorDeclaration,
  calculatorDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'googleSearch': executeGoogleSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'getCurrentWeather': executeGetCurrentWeather,
  'generateImage': executeImageGenerator,
  'generateVideo': executeVideoGenerator,
  'executeCode': executeCode,
  'calculator': executeCalculator,
};