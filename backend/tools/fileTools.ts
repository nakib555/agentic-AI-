/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';
import { fileStore } from '../services/fileStore';

export const executeListFiles = async (args: { path: string }): Promise<string> => {
    try {
        const files = await fileStore.listFiles(args.path);
        if (files.length === 0) {
            return `No files found in directory: ${args.path}`;
        }
        return `Files in ${args.path}:\n- ${files.join('\n- ')}`;
    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('listFiles', 'LISTING_FAILED', originalError.message, originalError, "Could not list files. The specified path might be incorrect or the virtual file system is unavailable.");
    }
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
        
        return `[FILE_ATTACHMENT_COMPONENT]${JSON.stringify(fileData)}[/FILE_ATTACHMENT_COMPONENT]`;

    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('displayFile', 'DISPLAY_FAILED', originalError.message, originalError, "The file could not be displayed. It might have been deleted or the path is incorrect. Try using `listFiles` to see available files.");
    }
};

export const executeDeleteFile = async (args: { path: string }): Promise<string> => {
    try {
        const fileExists = await fileStore.getFile(args.path);
        if (!fileExists) {
            throw new Error(`File not found at path: ${args.path}`);
        }
        await fileStore.deleteFile(args.path);
        return `File deleted successfully: ${args.path}`;
    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('deleteFile', 'DELETION_FAILED', originalError.message, originalError, "Could not delete the file. The path may be incorrect or you may not have permission.");
    }
};

export const executeWriteFile = async (args: { path: string, content: string }): Promise<string> => {
    const { path, content } = args;

    if (!path.startsWith('/main/output/')) {
        throw new ToolError('writeFile', 'INVALID_PATH', 'File path is not valid. Files can only be saved within the "/main/output/" directory.', undefined, 'Files can only be written to the "/main/output/" directory. Please correct the path.');
    }

    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        await fileStore.saveFile(path, blob);
        return `File saved successfully: ${path}`;
    } catch (err) {
        const originalError = err instanceof Error ? err : new Error(String(err));
        throw new ToolError('writeFile', 'WRITE_FAILED', originalError.message, originalError, "Could not write to the file. The path may be invalid or the storage might be full.");
    }
};
