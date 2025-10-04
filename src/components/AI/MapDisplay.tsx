/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

type MapDisplayProps = {
  destination: string;
  origin?: string;
};

const MapStatus = ({ message, isError = false }: { message: string, isError?: boolean }) => (
    <div className={`absolute inset-0 flex items-center justify-center z-10 ${isError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
        <div className="flex items-center gap-2 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg">
            {!isError && (
                 <svg style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <style>{'@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'}</style>
                    <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" fill="none"/>
                    <path d="M12,2V6A6,6,0,1,1,6,12H2A10,10,0,0,0,12,22Z" fill="currentColor"/>
                </svg>
            )}
            <span>{message}</span>
        </div>
    </div>
);

export const MapDisplay = ({ destination, origin }: MapDisplayProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading map...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const mapsApiKey = 'AIzaSyBE2otEGjLvw1lW9GK-F4a-fgxGoSawQ1w';
    
    const loader = new Loader({
      apiKey: mapsApiKey,
      version: 'weekly',
    });

    const initMap = async () => {
      try {
        // FIX: The `load()` method on the Loader was causing a type error. Switched to the modern
        // `loader.importLibrary()` API, which handles loading the base script and the required libraries.
        const { Map } = await loader.importLibrary('maps') as any;
        const { Geocoder } = await loader.importLibrary('geocoding') as any;
        const geocoder = new Geocoder();

        if (!mapRef.current) return;

        const geocodeAddress = (address: string): Promise<any> => {
            return new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        resolve(results[0].geometry.location);
                    } else {
                        reject(new Error(`Geocoding failed for "${address}": ${status}`));
                    }
                });
            });
        };
        
        setStatus('Geocoding locations...');
        const destinationLatLng = await geocodeAddress(destination);
        const map = new Map(mapRef.current, {
            center: destinationLatLng,
            zoom: 14,
            mapId: 'AGENTIC_AI_CHAT_MAP',
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
        });

        if (origin) {
            // Directions mode
            const { DirectionsService, DirectionsRenderer } = await loader.importLibrary('routes') as any;
            const directionsService = new DirectionsService();
            const directionsRenderer = new DirectionsRenderer();
            directionsRenderer.setMap(map);

            const originLatLng = await geocodeAddress(origin);

            setStatus('Calculating route...');
            directionsService.route(
                {
                    origin: originLatLng,
                    destination: destinationLatLng,
                    travelMode: 'DRIVING' as any,
                },
                (response, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(response);
                        setStatus('');
                    } else {
                        setIsError(true);
                        setStatus(`Directions request failed: ${status}`);
                    }
                }
            );

        } else {
            // Single point mode
            const { AdvancedMarkerElement } = await loader.importLibrary('marker') as any;
            new AdvancedMarkerElement({
                map,
                position: destinationLatLng,
                title: destination,
            });
            setStatus('');
        }

      } catch (e) {
        console.error('Map loading error:', e);
        setIsError(true);
        setStatus(e instanceof Error ? e.message : 'An unknown error occurred while loading the map.');
      }
    };

    initMap();

  }, [destination, origin]);

  return (
    <div className="relative my-4 h-[450px] w-full max-w-[90%] sm:max-w-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
      {status && <MapStatus message={status} isError={isError} />}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};
