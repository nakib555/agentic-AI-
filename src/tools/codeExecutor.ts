/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../../types';
import { executePythonWithPyodide } from './codeExecutor/pythonExecutor';
import { executeJsInWorker } from './codeExecutor/jsExecutor';
import { executeWithPiston } from './codeExecutor/pistonExecutor';

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes code in a secure sandboxed environment. Supports Python, JavaScript, and other languages. For Python, it can install packages from PyPI and perform network requests. For JavaScript, it can import libraries from CDNs and perform network requests. For other languages, it uses a more restricted environment without networking or package installation.',
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
      }
    },
    required: ['language', 'code'],
  },
};

// --- Main Dispatcher ---
export const executeCode = async (args: { language: string; code: string; packages?: string[]; cdn_urls?: string[]; }): Promise<string> => {
  const { language, code, packages, cdn_urls } = args;
  const lang = language.toLowerCase();

  try {
    if (lang === 'python' || lang === 'py') {
      return await executePythonWithPyodide(code, packages);
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
