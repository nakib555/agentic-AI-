/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type, GoogleGenAI } from "@google/genai";
import { fileStore } from '../services/fileStore';
import { ToolError } from '../types';
import { getText } from '../utils/geminiUtils';
import { parseApiError } from '../services/gemini/index';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const videoGeneratorDeclaration: FunctionDeclaration = {
  name: 'generateVideo',
  description: 'Generates a short video based on a textual description. Use for creating dynamic, animated content. Note: Video generation can take several minutes. You MUST inform the user of this potential delay in your thinking process before calling the tool.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the video to generate.' },
      aspectRatio: { type: Type.STRING, description: 'The aspect ratio of the video. Supported values are "16:9" (landscape) and "9:16" (portrait). Defaults to "16:9".' },
    },
    required: ['prompt'],
  },
};

// A special UI component tag returned when API key selection is required for Veo.
const VEO_API_KEY_COMPONENT_TAG = '[VEO_API_KEY_SELECTION_COMPONENT]To generate videos, please select an API key. This is a necessary step for using the Veo model. [Learn more about billing.](https://ai.google.dev/gemini-api/docs/billing)[/VEO_API_KEY_SELECTION_COMPONENT]';

export const executeVideoGenerator = async (args: { prompt: string; aspectRatio?: string; model: string }): Promise<string> => {
  // Per Veo guidelines, check for API key selection first.
  // The 'window.aistudio' object is assumed to be available in the execution environment.
  if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      return VEO_API_KEY_COMPONENT_TAG;
    }
  }

  const { prompt, aspectRatio = '16:9', model } = args;

  // Validate inputs
  const validAspectRatios = ['16:9', '9:16'];
  if (!validAspectRatios.includes(aspectRatio)) {
      throw new ToolError('generateVideo', 'INVALID_ARGUMENT', `Invalid aspectRatio "${aspectRatio}". Supported values are: ${validAspectRatios.join(', ')}.`);
  }

  try {
    // Per guidelines, create a new GoogleGenAI instance right before the API call to ensure it uses the latest key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // Generate the video using the prompt directly from the model
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio,
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
        throw new ToolError('generateVideo', 'NO_DOWNLOAD_LINK', 'Video generation succeeded but no download link was provided.', undefined, "The video was generated, but the download link is missing. This might be a temporary API issue.");
    }
    
    // The link requires the API key to be appended for access.
    const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    // Fetch the video data and store it as a blob
    const response = await fetch(fetchUrl);
    if (!response.ok) {
        throw new ToolError('generateVideo', 'DOWNLOAD_FAILED', `Failed to download video: ${response.statusText}`, undefined, "The generated video could not be downloaded. Please check your network connection and try again.");
    }
    const videoBlob = await response.blob();
    const filename = `/main/output/video-${generateId()}.mp4`;
    await fileStore.saveFile(filename, videoBlob);
    
    return `Video successfully generated and saved to virtual filesystem at: ${filename}. You can now use 'displayFile' to show it to the user.`;
  } catch (err) {
    console.error("Video generation tool failed:", err instanceof Error ? err : JSON.stringify(err));
    
    // The error object from the API might be nested. We need to find the message string.
    let errorMessage = "An unknown error occurred during video generation.";
    if (err instanceof Error) {
        errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null) {
        // Handle Google's structured API errors: { error: { message: "..." } }
        if ('error' in err && typeof (err as any).error === 'object' && (err as any).error !== null && 'message' in (err as any).error) {
            errorMessage = (err as any).error.message;
        } else {
             try { errorMessage = JSON.stringify(err); } catch { /* ignore */ }
        }
    } else {
        errorMessage = String(err);
    }
    
    // Per guidelines, if this specific error occurs, it indicates an issue with the API key.
    if (errorMessage.includes('Requested entity was not found.')) {
        return VEO_API_KEY_COMPONENT_TAG;
    }

    if (err instanceof ToolError) throw err;
    const originalError = err instanceof Error ? err : new Error(String(err));
    throw new ToolError('generateVideo', 'GENERATION_FAILED', errorMessage, originalError, "The video generation service failed. This can happen with complex prompts or during high traffic. Please try again in a moment.");
  }
};