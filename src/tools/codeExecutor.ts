/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../types';
import { executePythonWithPyodide } from './codeExecutor/pythonExecutor';
import { executeJsInWorker } from './codeExecutor/jsExecutor';
import { fileStore } from '../services/fileStore';

// The declaration is now in declarations.ts

// --- Main Dispatcher for FRONTEND execution ---
export const executeCode = async (args: { language: string; code: string; packages?: string[]; cdn_urls?: string[]; input_filenames?: string[] }): Promise<string> => {
  const { language, code, packages, cdn_urls, input_filenames } = args;
  const lang = language.toLowerCase();

  try {
    if (lang === 'python' || lang === 'py') {
        const input_files_data = [];
        let notFoundFiles: string[] = [];
        if (input_filenames && input_filenames.length > 0) {
            for (const path of input_filenames) {
                const blob = await fileStore.getFile(path);
                if (blob) {
                    const data = new Uint8Array(await blob.arrayBuffer());
                    const filename = path.split('/').pop() || path;
                    input_files_data.push({ filename, data });
                } else {
                    notFoundFiles.push(path);
                }
            }
        }
        if (notFoundFiles.length > 0) {
            throw new ToolError('executeCode', 'FILE_NOT_FOUND', `The following input files were not found in the virtual filesystem: ${notFoundFiles.join(', ')}`, undefined, "One or more files needed for this code could not be found. Try using the `listFiles` tool to see available files.");
        }
        return await executePythonWithPyodide(code, packages, input_files_data);
    }

    if (lang === 'javascript' || lang === 'js' || lang === 'html') {
      return await executeJsInWorker(code, cdn_urls);
    }
    
    // This should not be reached if the dispatcher in tool-executor is working correctly
    throw new ToolError('executeCode', 'UNSUPPORTED_LANGUAGE_FRONTEND', `Language "${language}" is not supported for frontend execution.`);

  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    if (error instanceof ToolError) throw error; // Re-throw tool errors
    throw new ToolError('executeCode', 'EXECUTION_FAILED', originalError.message, originalError, "An error occurred while executing the code. Check the 'Details' for technical information and try correcting the code.");
  }
};