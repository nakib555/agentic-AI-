/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file centralizes all FunctionDeclarations for the tools.
// The backend-executed tools' implementations are in `/backend/tools/`.
// The frontend-executed tools' implementations are in `/src/tools/`.

import { FunctionDeclaration, Type } from "@google/genai";

export const calculatorDeclaration: FunctionDeclaration = {
    name: 'calculator',
    description: 'Evaluates a mathematical expression. Supports basic arithmetic operators (+, -, *, /), parentheses, and numbers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: 'The mathematical expression to evaluate (e.g., "2 * (3 + 4)").' },
      },
      required: ['expression'],
    },
};

export const codeExecutorDeclaration: FunctionDeclaration = {
    name: 'executeCode',
    description: 'Executes code in a secure sandboxed environment. Supports Python, JavaScript, and other languages. For Python, it can install packages from PyPI, perform network requests, and read user-provided files.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, description: 'The programming language of the code to execute.' },
        code: { type: Type.STRING, description: 'The code snippet to execute.' },
        packages: { type: Type.ARRAY, description: '(Python only) A list of PyPI packages to install before running the code (e.g., ["numpy", "pandas", "requests"]).', items: { type: Type.STRING } },
        cdn_urls: { type: Type.ARRAY, description: '(JavaScript only) A list of CDN URLs for external libraries to import.', items: { type: Type.STRING } },
        input_filenames: { type: Type.ARRAY, description: '(Python only) A list of filenames from the virtual filesystem to be used as input.', items: { type: Type.STRING } }
      },
      required: ['language', 'code'],
    },
};

export const duckduckgoSearchDeclaration: FunctionDeclaration = {
    name: 'duckduckgoSearch',
    description: 'Dual-function tool. For general queries, it performs a web search. If the query provided is a valid URL, it will fetch and summarize the content of that specific webpage.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'The search query or a URL to summarize.' } },
      required: ['query'],
    },
};

export const imageGeneratorDeclaration: FunctionDeclaration = {
    name: 'generateImage',
    description: 'Generates one or more images based on a textual description. Use for creating static visual content like photos, illustrations, and graphics.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' },
        numberOfImages: { type: Type.NUMBER, description: 'The number of images to generate. Must be between 1 and 5. Defaults to 1. This is only supported by Imagen models.'},
        aspectRatio: { type: Type.STRING, description: 'The aspect ratio for the image. Supported for Imagen models: "1:1", "3:4", "4:3", "9:16", "16:9". Defaults to a responsive ratio (9:16 on mobile, 16:9 on desktop).' },
      },
      required: ['prompt'],
    },
};

export const getCurrentLocationDeclaration: FunctionDeclaration = {
    name: 'getCurrentLocation',
    description: "Gets the user's current geographical location (latitude and longitude).",
    parameters: { type: Type.OBJECT, properties: {} },
};
  
export const requestLocationPermissionDeclaration: FunctionDeclaration = {
    name: 'requestLocationPermission',
    description: "Asks the user for location permission after it was previously denied. This will render a special UI prompt for the user.",
    parameters: { type: Type.OBJECT, properties: {} },
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
  
export const analyzeMapVisuallyDeclaration: FunctionDeclaration = {
    name: 'analyzeMapVisually',
    description: 'Analyzes the map area at a given latitude and longitude and returns a textual description of visible landmarks, parks, and road layouts. Use this after displaying a map if you need to "see" what is on it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        latitude: { type: Type.NUMBER, description: 'The latitude of the map area to analyze.' },
        longitude: { type: Type.NUMBER, description: 'The longitude of the map area to analyze.' },
      },
      required: ['latitude', 'longitude'],
    },
};

export const analyzeImageVisuallyDeclaration: FunctionDeclaration = {
    name: 'analyzeImageVisually',
    description: 'Analyzes a visual image and returns a detailed textual description. Use this to "see" and validate the content of images generated by `generateImage` or screenshots from `captureCodeOutputScreenshot`.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filePath: { type: Type.STRING, description: 'The full path of the image file in the virtual filesystem to analyze (e.g., "/main/output/image-xyz.png").' },
        imageBase64: { type: Type.STRING, description: 'A base64 encoded string of an image to analyze. Typically used with the output from `captureCodeOutputScreenshot`.' },
      },
    },
};

export const captureCodeOutputScreenshotDeclaration: FunctionDeclaration = {
    name: 'captureCodeOutputScreenshot',
    description: 'Takes a screenshot of the visual output generated by the `executeCode` tool. This allows you to "see" and analyze plots, tables, and other HTML-based results.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        outputId: {
          type: Type.STRING,
          description: 'The unique ID of the code output component to capture. This ID is provided in the result of an `executeCode` call that generated a visual output.',
        },
      },
      required: ['outputId'],
    },
};
  
export const videoGeneratorDeclaration: FunctionDeclaration = {
    name: 'generateVideo',
    description: 'Generates a short video based on a textual description. Use for creating dynamic, animated content. Note: Video generation can take several minutes. You MUST inform the user of this potential delay in your thinking process before calling the tool.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'A detailed description of the video to generate.' },
        aspectRatio: { type: Type.STRING, description: 'The aspect ratio of the video. Supported values are "16:9" (landscape) and "9:16" (portrait). Defaults to a responsive ratio (9:16 on mobile, 16:9 on desktop).' },
        resolution: { type: Type.STRING, description: 'The resolution of the video. Supported values are "720p" and "1080p". Defaults to "720p".' }
      },
      required: ['prompt'],
    },
};

export const listFilesDeclaration: FunctionDeclaration = {
    name: 'listFiles',
    description: 'Lists the files and directories at a given path in the virtual filesystem. Essential for keeping track of generated files.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'The path of the directory to list (e.g., "/main/output").' },
      },
      required: ['path'],
    },
};
  
export const displayFileDeclaration: FunctionDeclaration = {
    name: 'displayFile',
    description: 'Renders a file from the virtual filesystem for the user to see. After generating an image, video, or downloadable file, use this tool to display it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'The full path of the file to display (e.g., "/main/output/image-xyz.png").' },
      },
      required: ['path'],
    },
};
  
export const deleteFileDeclaration: FunctionDeclaration = {
    name: 'deleteFile',
    description: 'Deletes a file from the virtual filesystem. Use this to remove temporary, flawed, or unwanted files.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'The full path of the file to delete (e.g., "/main/output/flawed-image.png").' },
      },
      required: ['path'],
    },
};
  
export const writeFileDeclaration: FunctionDeclaration = {
    name: 'writeFile',
    description: 'Saves text content to a new file in the virtual filesystem. Useful for creating notes, saving generated code, or storing intermediate results from research.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'The full path where the file will be saved (e.g., "/main/output/my_note.md"). Must be in a writable directory.' },
        content: { type: Type.STRING, description: 'The text content to write into the file.' },
      },
      required: ['path', 'content'],
    },
};

// Export all tool declarations for the model in a single array
export const toolDeclarations = [
    duckduckgoSearchDeclaration,
    getCurrentLocationDeclaration,
    imageGeneratorDeclaration,
    videoGeneratorDeclaration,
    codeExecutorDeclaration,
    displayMapDeclaration,
    requestLocationPermissionDeclaration,
    analyzeMapVisuallyDeclaration,
    analyzeImageVisuallyDeclaration,
    captureCodeOutputScreenshotDeclaration,
    calculatorDeclaration,
    writeFileDeclaration,
    listFilesDeclaration,
    displayFileDeclaration,
    deleteFileDeclaration,
];