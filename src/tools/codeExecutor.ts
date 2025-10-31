/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../types';
import { executePythonWithPyodide } from './codeExecutor/pythonExecutor';
import { executeJsInWorker } from './codeExecutor/jsExecutor';
import { executeWithPiston } from './codeExecutor/pistonExecutor';

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes code in a secure sandboxed environment. Supports Python, JavaScript, and other languages. For Python, it can install packages from PyPI, perform network requests, and read user-provided files. For JavaScript, it can import libraries from CDNs and perform network requests. For other languages, it uses a more restricted environment without networking or package installation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: {
        type: Type.STRING,
        description: 'The programming language of the code to execute.'
      },
      code: {
        type: Type.STRING,
        description: 'The code snippet to execute.'
      },
      packages: {
        type: Type.ARRAY,
        description: '(Python only) A list of PyPI packages to install before running the code (e.g., ["numpy", "pandas", "requests"]).',
        items: { type: Type.STRING }
      },
      cdn_urls: {
        type: Type.ARRAY,
        description: '(JavaScript only) A list of CDN URLs for external libraries to import before running the code.',
        items: { type: Type.STRING }
      },
      input_filenames: {
        type: Type.ARRAY,
        description: '(Python only) A list of filenames the user attached in their prompt. The tool will automatically load these files into the /main/input/ directory for the script to use.',
        items: { type: Type.STRING }
      }
    },
    required: ['language', 'code'],
  },
};

// --- Main Dispatcher ---
export const executeCode = async (args: { language: string; code: string; packages?: string[]; cdn_urls?: string[]; input_files?: { filename: string, data: Uint8Array }[] }): Promise<string> => {
  const { language, code, packages, cdn_urls, input_files } = args;
  const lang = language.toLowerCase();

  try {
    if (lang === 'python' || lang === 'py') {
      return await executePythonWithPyodide(code, packages, input_files);
    }

    if (lang === 'javascript' || lang === 'js' || lang === 'html') {
      return await executeJsInWorker(code, cdn_urls);
    }
    
    return await executeWithPiston(lang, code);
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    if (error instanceof ToolError) throw error; // Re-throw tool errors
    throw new ToolError('executeCode', 'EXECUTION_FAILED', originalError.message, originalError);
  }
};