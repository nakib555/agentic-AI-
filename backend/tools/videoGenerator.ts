/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../../src/types";

export const executeVideoGenerator = async (ai: GoogleGenAI, args: { prompt: string; aspectRatio?: string; resolution?: string, model: string }): Promise<string> => {
    const defaultAspectRatio = '16:9';
    const { prompt, aspectRatio = defaultAspectRatio, resolution = '720p', model } = args;

    const validAspectRatios = ['16:9', '9:16'];
    const validResolutions = ['720p', '1080p'];
    if (!validAspectRatios.includes(aspectRatio)) throw new ToolError('generateVideo', 'INVALID_ARGUMENT', `Invalid aspectRatio "${aspectRatio}".`);
    if (!validResolutions.includes(resolution)) throw new ToolError('generateVideo', 'INVALID_ARGUMENT', `Invalid resolution "${resolution}".`);
  
    try {
      const enhancementPrompt = `You are a creative director specializing in video prompts. Rewrite and expand the following user prompt to be more cinematic, detailed, and visually rich for a video generation model. Focus on setting, mood, action, camera movement, and visual style.
  
      User Prompt: "${prompt}"
      
      Enhanced Cinematic Prompt:`;
      const enhancementResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: enhancementPrompt });
      const enhancedPrompt = enhancementResponse.text.trim();
  
      let operation = await ai.models.generateVideos({
        model: model,
        prompt: enhancedPrompt,
        config: { numberOfVideos: 1, aspectRatio, resolution }
      });
  
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
  
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new ToolError('generateVideo', 'NO_DOWNLOAD_LINK', 'Video generation succeeded but no download link was provided.');
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const response = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!response.ok) throw new ToolError('generateVideo', 'DOWNLOAD_FAILED', `Failed to download video: ${response.statusText}`);
      
      const videoArrayBuffer = await response.arrayBuffer();
      const videoBase64 = Buffer.from(videoArrayBuffer).toString('base64');
      
      const videoData = {
          srcUrl: `data:video/mp4;base64,${videoBase64}`,
          prompt: `Video generation result for: ${prompt}`
      };
      
      return `[VIDEO_COMPONENT]${JSON.stringify(videoData)}[/VIDEO_COMPONENT]`;
    } catch (err) {
      console.error("Video generation tool failed:", err);
      if (err instanceof ToolError) throw err;
      const originalError = err instanceof Error ? err : new Error(String(err));
      throw new ToolError('generateVideo', 'GENERATION_FAILED', originalError.message, originalError);
    }
  };