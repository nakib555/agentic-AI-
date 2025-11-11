/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { fileStore } from "../services/fileStore";

export const executeVideoGenerator = async (ai: GoogleGenAI, args: { prompt: string; aspectRatio?: string; resolution?: string, model: string }): Promise<string> => {
    const { prompt, aspectRatio = '16:9', resolution = '720p', model } = args;

    try {
        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution as any,
                aspectRatio: aspectRatio as any,
            }
        });

        // Simplified polling loop for development
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Video generation operation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation succeeded but no download link was provided.');
        }

        const apiKey = process.env.API_KEY;
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download video file. Status: ${response.status}`);
        }

        const videoBlob = await response.blob();
        const filename = `video_${Date.now()}.mp4`;
        const filePath = `/main/output/${filename}`;
        
        await fileStore.saveFile(filePath, videoBlob);

        const videoData = { fileKey: filePath, prompt: prompt };
        return `Successfully generated video and saved to ${filePath}.\n\n[VIDEO_COMPONENT]${JSON.stringify(videoData)}[/VIDEO_COMPONENT]`;

    } catch (error) {
        if (error instanceof ToolError) throw error;
        const originalError = error instanceof Error ? error : new Error(String(error));
        throw new ToolError('generateVideo', 'BACKEND_EXECUTION_FAILED', originalError.message, originalError);
    }
};