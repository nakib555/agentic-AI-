/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { fileStore } from '../services/fileStore';

export const executeAnalyzeMapVisually = async (ai: GoogleGenAI, args: { latitude: number, longitude: number }): Promise<string> => {
    const { latitude, longitude } = args;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new ToolError('analyzeMapVisually', 'INVALID_COORDINATES', 'Latitude and longitude must be numbers.');
    }
  
    try {
      const prompt = `You are a cartography expert. Based on the geographical coordinates latitude=${latitude} and longitude=${longitude}, provide a concise, bulleted list describing the key landmarks, major roads, parks, and general layout of the immediate area. Focus on what would be visually prominent on a standard map view. Do not mention the coordinates in your response.`;
  
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return `Visual analysis of the map at lat ${latitude.toFixed(4)}, lon ${longitude.toFixed(4)}:\n${response.text}`;
  
    } catch (err) {
      const originalError = err instanceof Error ? err : new Error(String(err));
      throw new ToolError('analyzeMapVisually', 'ANALYSIS_FAILED', originalError.message, originalError);
    }
};

export const executeAnalyzeImageVisually = async (ai: GoogleGenAI, args: { filePath?: string, imageBase64?: string }, chatId: string): Promise<string> => {
    const { filePath, imageBase64 } = args;
    if (!filePath && !imageBase64) {
      throw new ToolError('analyzeImageVisually', 'MISSING_ARGUMENT', 'Either filePath or imageBase64 must be provided.');
    }
    
    let imageData = imageBase64;
    if (filePath) {
        const fileBuffer = await fileStore.getFile(chatId, filePath);
        if (!fileBuffer) {
            throw new ToolError('analyzeImageVisually', 'FILE_NOT_FOUND', `File not found at path: ${filePath}`);
        }
        imageData = fileBuffer.toString('base64');
    }
  
    if (!imageData) {
        throw new ToolError('analyzeImageVisually', 'MISSING_DATA', 'Backend image analysis requires image data.');
    }
  
    try {
      const imagePart = { inlineData: { mimeType: 'image/png', data: imageData } };
      const textPart = { text: "Describe this image in meticulous detail. What does it show? Are there any visible flaws, errors, or unexpected elements?" };
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: { parts: [imagePart, textPart] },
      });
  
      return `Visual analysis of the image:\n${response.text}`;
  
    } catch (err) {
      const originalError = err instanceof Error ? err : new Error(String(err));
      throw new ToolError('analyzeImageVisually', 'ANALYSIS_FAILED', originalError.message, originalError);
    }
};