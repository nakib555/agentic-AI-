/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeGetCurrentLocation, executeRequestLocationPermission } from './location';
import { executeVideoGenerator } from './videoGenerator';
import { executeDisplayMap } from './map';
import { executeCaptureCodeOutputScreenshot } from './screenshot';

// Map of tool names to their FRONTEND implementation
export const toolImplementations: Record<string, (args: any) => string | Promise<string>> = {
  'getCurrentLocation': executeGetCurrentLocation,
  'requestLocationPermission': executeRequestLocationPermission,
  'videoGenerator': executeVideoGenerator,
  'displayMap': executeDisplayMap,
  'captureCodeOutputScreenshot': executeCaptureCodeOutputScreenshot,
};
