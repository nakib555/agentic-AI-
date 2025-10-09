/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { googleSearchDeclaration, executeGoogleSearch } from './googleSearch';
import { getCurrentLocationDeclaration, executeGetCurrentLocation } from './location';
import { imageGeneratorDeclaration, executeImageGenerator } from './imageGenerator';
import { videoGeneratorDeclaration, executeVideoGenerator } from './videoGenerator';


// Export all tool declarations for the model
export const toolDeclarations = [
  googleSearchDeclaration,
  getCurrentLocationDeclaration,
  imageGeneratorDeclaration,
  videoGeneratorDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'googleSearch': executeGoogleSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'generateImage': executeImageGenerator,
  'generateVideo': executeVideoGenerator,
};