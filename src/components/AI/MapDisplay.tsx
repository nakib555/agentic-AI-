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

      // Initialize the map with a wide, zoomed-out world view
      const map = window.L.map(mapRef.current).setView([20, 0], 2);

      // Add a tile layer to the map (OpenStreetMap is a free option)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // After a short delay to allow the map to render, animate to the target location.
      setTimeout(() => {
        map.flyTo([latitude, longitude], zoom, {
          animate: true,
          duration: 4 // Animation duration in seconds for a slower, smoother effect
        });

        // Add the marker as the animation is nearing its end for a polished feel.
        setTimeout(() => {
            const marker = window.L.marker([latitude, longitude]).addTo(map);
            if (markerText) {
                marker.bindPopup(markerText).openPopup();
            }
        }, 3500); // 3.5-second delay to sync with the fly-to animation

      }, 500); // Start the fly-to animation 500ms after the component mounts
    }
  }, [latitude, longitude, zoom, markerText]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200/10 shadow-lg relative z-0">
      <div
        ref={mapRef}
        className="h-80 w-full bg-slate-800"
        aria-label={`Map centered at latitude ${latitude}, longitude ${longitude}`}
      />
    </div>
  );
};