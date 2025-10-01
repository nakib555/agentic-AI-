/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

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
      reject(new Error("Geolocation is not supported by this browser."));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`Current location: Latitude ${latitude.toFixed(4)}, Longitude ${longitude.toFixed(4)}`);
        },
        (error) => {
          let errorMessage = "An unknown error occurred while fetching location.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
};