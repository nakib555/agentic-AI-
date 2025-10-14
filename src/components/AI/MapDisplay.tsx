/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// Declare Leaflet's 'L' object on the window for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

type MapDisplayProps = {
  latitude: number;
  longitude: number;
  zoom: number;
  markerText?: string;
};

export const MapDisplay = ({ latitude, longitude, zoom, markerText }: MapDisplayProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const isMapInitialized = useRef(false);

  useEffect(() => {
    // Ensure Leaflet is loaded and the map container is rendered
    if (window.L && mapRef.current && !isMapInitialized.current) {
      isMapInitialized.current = true; // Prevent re-initialization

      // Initialize the map and set its view
      const map = window.L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Add a tile layer to the map (OpenStreetMap is a free option)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add a marker if markerText is provided
      if (markerText) {
        window.L.marker([latitude, longitude]).addTo(map)
          .bindPopup(markerText)
          .openPopup();
      } else {
        // Add a simple marker without a popup if no text is given
        window.L.marker([latitude, longitude]).addTo(map);
      }
      
      // Leaflet maps can sometimes have issues with initial sizing in dynamic containers.
      // This invalidates the map size after a short delay to ensure it renders correctly.
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [latitude, longitude, zoom, markerText]);

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
      <div
        ref={mapRef}
        className="h-80 w-full bg-slate-200 dark:bg-slate-800"
        aria-label={`Map centered at latitude ${latitude}, longitude ${longitude}`}
      />
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 text-center">
        Map centered at: {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </div>
    </div>
  );
};
