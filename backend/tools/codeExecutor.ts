
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError.js';
import { fileStore } from '../services/fileStore.js';
import { executeWithPiston } from './piston.js';

export const executeCode = async (args: { language: string; code: string; packages?: string[]; input_filenames?: string[] }, chatId: string): Promise<string> => {
  const { language, code, input_filenames } = args;

  try {
    // Gather input files from virtual file system if requested
    const files: { name: string; content: string }[] = [];
    files.push({ name: 'main', content: code }); // Main code file

    if (input_filenames && Array.isArray(input_filenames)) {
        for (const filePath of input_filenames) {
            try {
                const fileBuffer = await fileStore.getFile(chatId, filePath);
                if (fileBuffer) {
                    // Piston expects text content for files. 
                    // If it's a text file, we decode it. 
                    // Binary file support in Piston is limited/complex via JSON API, so we attempt UTF-8.
                    // Ideally, we should check mime type, but for code input (csv, json, txt), utf-8 is safe.
                    files.push({
                        name: filePath.split('/').pop() || 'file',
                        content: fileBuffer.toString('utf-8')
                    });
                } else {
                    console.warn(`[executeCode] Input file not found: ${filePath}`);
                }
            } catch (e) {
                console.warn(`[executeCode] Failed to read input file ${filePath}:`, e);
            }
        }
    }

    // Execute via Piston with all gathered files
    return await executeWithPiston(language, files);
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    if (error instanceof ToolError) throw error; // Re-throw tool errors
    throw new ToolError('executeCode', 'EXECUTION_FAILED', originalError.message, originalError, "An error occurred while executing the code. Check the 'Details' for technical information and try correcting the code.");
  }
};
