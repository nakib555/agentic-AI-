/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../types';
import { fileStore } from '../services/fileStore';

// --- listFiles Tool ---

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

export const executeListFiles = async (args: { path: string }): Promise<string> => {
    try {
        const files = await fileStore.listFiles(args.path);
        if (files.length === 0) {
            return `No files found in directory: ${args.path}`;
        }
        return `Files in ${args.path}:\n- ${files.join('\n- ')}`;
    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('listFiles', 'LISTING_FAILED', originalError.message, originalError);
    }
};

// --- displayFile Tool ---

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

export const executeDisplayFile = async (args: { path: string }): Promise<string> => {
    try {
        const blob = await fileStore.getFile(args.path);
        if (!blob) {
            throw new Error(`File not found at path: ${args.path}`);
        }

        const mimeType = blob.type;
        const filename = args.path.split('/').pop() || 'file';
        const fileData = { fileKey: args.path, filename, mimeType };

        if (mimeType.startsWith('image/')) {
            return `[IMAGE_COMPONENT]${JSON.stringify({ fileKey: args.path, caption: `Image: ${filename}` })}[/IMAGE_COMPONENT]`;
        }
        if (mimeType.startsWith('video/')) {
            return `[VIDEO_COMPONENT]${JSON.stringify({ fileKey: args.path, prompt: `Video: ${filename}` })}[/VIDEO_COMPONENT]`;
        }
        
        // Fallback for any other file type
        return `[FILE_ATTACHMENT_COMPONENT]${JSON.stringify(fileData)}[/FILE_ATTACHMENT_COMPONENT]`;

    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('displayFile', 'DISPLAY_FAILED', originalError.message, originalError);
    }
};