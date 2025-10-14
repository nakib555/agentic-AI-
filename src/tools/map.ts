/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

// A more detailed interface for our location data, including aliases for multilingual search.
interface LocationData {
    lat: number;
    lng: number;
    name: string; // Primary English name
    localName: string; // Local language name for display
    country: string;
    aliases: string[]; // Other names, including different languages
}

// A unified mock geocoding database that supports multilingual queries via aliases.
// In a real application, this would be an API call to a service like Nominatim or Google Geocoding.
const geocodeDatabase: LocationData[] = [
    { lat: 48.8584, lng: 2.2945, name: 'Eiffel Tower', localName: 'Tour Eiffel', country: 'France', aliases: ['eiffel tower, paris', 'tour eiffel'] },
    { lat: 40.6892, lng: -74.0445, name: 'Statue of Liberty', localName: 'Statue of Liberty', country: 'USA', aliases: ['statue of liberty, new york', 'statua della libertà', '自由の女神'] },
    { lat: 35.7101, lng: 139.8107, name: 'Tokyo Skytree', localName: '東京スカイツリー', country: 'Japan', aliases: ['tokyo skytree', '東京スカイツリー'] },
    { lat: 41.8902, lng: 12.4922, name: 'The Colosseum', localName: 'Colosseo', country: 'Italy', aliases: ['colosseum, rome', 'colosseo'] },
    { lat: -33.8568, lng: 151.2153, name: 'Sydney Opera House', localName: 'Sydney Opera House', country: 'Australia', aliases: ['sydney opera house'] },
    { lat: 51.5007, lng: -0.1246, name: 'Big Ben', localName: 'Big Ben', country: 'UK', aliases: ['big ben, london'] },
    { lat: 27.1751, lng: 78.0421, name: 'Taj Mahal', localName: 'ताज महल', country: 'India', aliases: ['taj mahal, india', 'ताज महल'] },
    { lat: 29.9792, lng: 31.1342, name: 'Pyramids of Giza', localName: 'أهرامات الجيزة', country: 'Egypt', aliases: ['pyramids of giza, egypt', 'أهرامات الجيزة'] },
];

export const searchAndDisplayMapDeclaration: FunctionDeclaration = {
  name: 'searchAndDisplayMap',
  description: 'Searches for a location by name or address (including in other languages) and displays it on a map.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The name or address of the location to search for, e.g., "Eiffel Tower", "Tour Eiffel", or "1600 Amphitheatre Parkway, Mountain View, CA".' },
    },
    required: ['query'],
  },
};

export const executeSearchAndDisplayMap = (args: { query: string }): string => {
    const query = args.query.toLowerCase().trim();
    
    // Find a location by checking the primary name and all aliases.
    const location = geocodeDatabase.find(loc => 
        loc.name.toLowerCase().includes(query) || 
        loc.aliases.some(alias => alias.toLowerCase().includes(query))
    );

    if (location) {
        const mapData = {
            latitude: location.lat,
            longitude: location.lng,
            zoom: 17, // Zoom in closer for specific landmarks
            markerText: location.localName, // Use the local name for the marker
        };
        return `[MAP_COMPONENT]${JSON.stringify(mapData)}[/MAP_COMPONENT]`;
    } else {
        return `Error: Could not find a location for the query: "${args.query}". Please ask the user for a more specific address or a well-known landmark.`;
    }
};

export const displayMapDeclaration: FunctionDeclaration = {
  name: 'displayMap',
  description: 'Displays an interactive map centered on a specific geographical location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      latitude: { type: Type.NUMBER, description: 'The latitude for the center of the map.' },
      longitude: { type: Type.NUMBER, description: 'The longitude for the center of the map.' },
      zoom: { type: Type.NUMBER, description: 'The zoom level of the map, from 1 (world) to 18 (street level). Default is 13.' },
      markerText: { type: Type.STRING, description: 'Optional text to display in a popup on a marker at the specified location.' }
    },
    required: ['latitude', 'longitude'],
  },
};

export const executeDisplayMap = (args: { latitude: number; longitude: number; zoom?: number, markerText?: string }): string => {
  const { latitude, longitude, zoom = 13, markerText } = args;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'Error: Latitude and longitude must be numbers.';
  }

  const mapData = {
      latitude,
      longitude,
      zoom,
      markerText
  };

  return `[MAP_COMPONENT]${JSON.stringify(mapData)}[/MAP_COMPONENT]`;
};