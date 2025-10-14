
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../types';

export const getCurrentLocationDeclaration: FunctionDeclaration = {
  name: 'getCurrentLocation',
  description: "Gets the user's current geographical location (latitude and longitude).",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

export const executeGetCurrentLocation = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new ToolError("getCurrentLocation", "GEOLOCATION_UNSUPPORTED", "Geolocation is not supported by this browser."));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`Current location: Latitude ${latitude.toFixed(4)}, Longitude ${longitude.toFixed(4)}`);
        },
        (error) => {
          let code: string;
          let message: string;

          switch(error.code) {
            case error.PERMISSION_DENIED:
              code = 'GEOLOCATION_PERMISSION_DENIED';
              message = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              code = 'GEOLOCATION_UNAVAILABLE';
              message = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              code = 'GEOLOCATION_TIMEOUT';
              message = "The request to get user location timed out.";
              break;
            default:
              code = 'GEOLOCATION_UNKNOWN_ERROR';
              message = "An unknown error occurred while fetching location.";
              break;
          }
          reject(new ToolError("getCurrentLocation", code, message, new Error(error.message)));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
};
