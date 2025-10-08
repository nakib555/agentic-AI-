/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";
import { videoStore } from '../services/videoStore';

export const videoGeneratorDeclaration: FunctionDeclaration = {
  name: 'generateVideo',
  description: 'Generates a short video based on a textual description. Use for creating dynamic, animated content. Note: Video generation can take several minutes. You MUST inform the user of this potential delay in your thinking process before calling the tool.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the video to generate.' },
    },
    required: ['prompt'],
  },
};

export const executeVideoGenerator = async (args: { prompt: string }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: args.prompt,
      config: {
        numberOfVideos: 1
      }
    });

    // Poll for the result
    while (!operation.done) {
      // Wait for 10 seconds before polling again, as per guidance
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation succeeded but no download link was provided.');
    }
    
    // The link requires the API key to be appended for access.
    const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    // Fetch the video data and store it as a blob
    const response = await fetch(fetchUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoKey = await videoStore.saveVideo(videoBlob);
    
    const videoData = { videoKey: videoKey, prompt: args.prompt };
    return `[VIDEO_COMPONENT]${JSON.stringify(videoData)}[/VIDEO_COMPONENT]`;
  } catch (err) {
    console.error("Video generation tool failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video generation.";
    // Return a user-friendly error message to the AI.
    return `Error generating video: ${errorMessage}`;
  }
};
