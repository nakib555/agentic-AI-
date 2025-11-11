/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeGetCurrentLocation, executeRequestLocationPermission } from './location';
import { executeVideoGenerator } from './videoGenerator';
import { executeCode } from './codeExecutor';
import { executeDisplayMap } from './map';
import { executeCaptureCodeOutputScreenshot } from './screenshot';
import { executeCalculator } from './calculator';
import { executeListFiles, executeDisplayFile, executeDeleteFile, executeWriteFile } from './fileTools';
import { toolDeclarations } from './declarations';

// Re-export declarations for the model
export { toolDeclarations };

// Map of tool names to their FRONTEND implementation
// Tools that run on the backend are handled by the tool-executor dispatcher
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'getCurrentLocation': executeGetCurrentLocation,
  'requestLocationPermission': executeRequestLocationPermission,
  'videoGenerator': executeVideoGenerator, // Special case: frontend wrapper for backend call
  'executeCode': executeCode, // Handles Pyodide/JS locally
  'displayMap': executeDisplayMap,
  'captureCodeOutputScreenshot': executeCaptureCodeOutputScreenshot,
  'calculator': executeCalculator,
  'writeFile': executeWriteFile,
  'listFiles': executeListFiles,
  'displayFile': executeDisplayFile,
  'deleteFile': executeDeleteFile,
};