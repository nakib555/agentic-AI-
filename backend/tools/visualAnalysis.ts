/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError";

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

export const executeAnalyzeImageVisually = async (ai: GoogleGenAI, args: { filePath?: string, imageBase64?: string }): Promise<string> => {
    const { filePath, imageBase64 } = args;
    if (!filePath && !imageBase64) {
      throw new ToolError('analyzeImageVisually', 'MISSING_ARGUMENT', 'Either filePath or imageBase64 must be provided.');
    }
    
    // In this backend version, we expect the frontend to send base64 data.
    // The filePath logic would require a shared file system (e.g., S3), which is out of scope.
    if (!imageBase64) {
      throw new ToolError('analyzeImageVisually', 'MISSING_DATA', 'Backend image analysis requires imageBase64 data.');
    }
  
    try {
      const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
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