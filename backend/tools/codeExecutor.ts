/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';
import { fileStore } from '../services/fileStore';
import { executeWithPiston } from './piston';

export const executeCode = async (args: { language: string; code: string; packages?: string[]; input_filenames?: string[] }): Promise<string> => {
  const { language, code } = args;

  try {
    // For this refactoring, we'll route all code execution to Piston.
    // The complex Pyodide logic with package installation and file I/O is a significant
    // undertaking to replicate on a standard Node.js backend and is simplified for this step.
    return await executeWithPiston(language, code);
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    if (error instanceof ToolError) throw error; // Re-throw tool errors
    throw new ToolError('executeCode', 'EXECUTION_FAILED', originalError.message, originalError, "An error occurred while executing the code. Check the 'Details' for technical information and try correcting the code.");
  }
};
