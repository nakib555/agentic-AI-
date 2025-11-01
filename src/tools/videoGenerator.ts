/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";
import { videoStore } from '../services/videoStore';
import { ToolError } from '../types';
import { getText } from '../utils/geminiUtils';
import { parseApiError } from '../services/gemini';

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

    // 1. Enhance the user's prompt for better video quality
    const enhancementPrompt = `
      You are a master cinematographer and creative director for a cutting-edge video generation AI.
      Your task is to take a user's simple idea and expand it into a rich, detailed, and cinematic shot description.
      The enhanced prompt must be a single, fluent paragraph, suitable for direct input into a video generation model.

      Incorporate the following cinematic concepts into your enhancement:
      - **Cinematography 🎬**: Describe the camera shot (e.g., wide shot, close-up, dolly zoom, aerial shot), camera movement, and angle.
      - **Lighting 💡**: Detail the lighting style (e.g., golden hour, neon noir, dramatic backlighting, soft ambient light).
      - **Mood & Atmosphere 🎭**: Evoke a specific mood (e.g., mysterious, joyful, epic, serene, chaotic).
      - **Subject & Action 🏃**: Clearly describe the main subject and what they are doing with vivid action verbs.
      - **Setting & Details 🌍**: Paint a picture of the environment with specific, sensory details.
      - **Visual Style ✨**: Specify an overall aesthetic (e.g., hyperrealistic, cinematic 4K, retro VHS, anime style, claymation).

      ---
      Original User Prompt: "${args.prompt}"
      ---

      Enhanced Cinematic Prompt:
    `;

    const enhancementResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: enhancementPrompt,
    });
    
    const enhancedPrompt = getText(enhancementResponse).trim();

    // 2. Generate the video using the enhanced prompt
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: enhancedPrompt,
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
        throw new ToolError('generateVideo', 'NO_DOWNLOAD_LINK', 'Video generation succeeded but no download link was provided.');
    }
    
    // The link requires the API key to be appended for access.
    const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    // Fetch the video data and store it as a blob
    const response = await fetch(fetchUrl);
    if (!response.ok) {
        throw new ToolError('generateVideo', 'DOWNLOAD_FAILED', `Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoKey = await videoStore.saveVideo(videoBlob);
    
    const videoData = { videoKey: videoKey, prompt: enhancedPrompt };
    return `[VIDEO_COMPONENT]${JSON.stringify(videoData)}[/VIDEO_COMPONENT]`;
  } catch (err) {
    console.error("Video generation tool failed:", err);
    if (err instanceof ToolError) throw err;
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video generation.";
    throw new ToolError('generateVideo', 'GENERATION_FAILED', errorMessage, err as Error);
  }
};