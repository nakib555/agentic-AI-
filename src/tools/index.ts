/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { duckduckgoSearchDeclaration, executeDuckDuckGoSearch } from './duckduckgo';
import { getCurrentLocationDeclaration, executeGetCurrentLocation, requestLocationPermissionDeclaration, executeRequestLocationPermission } from './location';
import { imageGeneratorDeclaration, executeImageGenerator } from './imageGenerator';
import { videoGeneratorDeclaration, executeVideoGenerator } from './videoGenerator';
import { codeExecutorDeclaration, executeCode } from './codeExecutor';
import { displayMapDeclaration, executeDisplayMap, analyzeMapVisuallyDeclaration, executeAnalyzeMapVisually } from './map';
import { captureCodeOutputScreenshotDeclaration, executeCaptureCodeOutputScreenshot } from './screenshot';


// Export all tool declarations for the model
export const toolDeclarations = [
  duckduckgoSearchDeclaration,
  getCurrentLocationDeclaration,
  imageGeneratorDeclaration,
  videoGeneratorDeclaration,
  codeExecutorDeclaration,
  displayMapDeclaration,
  requestLocationPermissionDeclaration,
  analyzeMapVisuallyDeclaration,
  captureCodeOutputScreenshotDeclaration,
];

// Map of tool names to their implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'duckduckgoSearch': executeDuckDuckGoSearch,
  'getCurrentLocation': executeGetCurrentLocation,
  'generateImage': executeImageGenerator,
  'generateVideo': executeVideoGenerator,
  'executeCode': executeCode,
  'displayMap': executeDisplayMap,
  'requestLocationPermission': executeRequestLocationPermission,
  'analyzeMapVisually': executeAnalyzeMapVisually,
  'captureCodeOutputScreenshot': executeCaptureCodeOutputScreenshot,
};
