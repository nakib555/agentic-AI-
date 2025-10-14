/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes a block of code in a specified language. Use for calculations, data manipulation, or any task that can be solved programmatically. The execution environment is a secure sandbox.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: {
        type: Type.STRING,
        description: 'The programming language of the code block (e.g., "javascript").'
      },
      code: {
        type: Type.STRING,
        description: 'The code snippet to execute.'
      },
      libraries: {
        type: Type.ARRAY,
        description: 'An optional array of CDN URLs for external libraries to import (e.g., "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js").',
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ['language', 'code'],
  },
};

const executeJavaScript = (code: string, libraries: string[] = []): Promise<string> => {
    return new Promise((resolve) => {
        // Use a Web Worker for sandboxed execution
        const workerCode = `
            self.onmessage = function(e) {
                const { code, libraries } = e.data;
                const logs = [];
                const originalLog = console.log;
                // Override console.log to capture output
                console.log = (...args) => {
                    logs.push(args.map(arg => {
                        try {
                            // Stringify objects for clear logging
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }).join(' '));
                    originalLog.apply(console, args);
                };

                try {
                    // Import external libraries if provided
                    if (libraries && libraries.length > 0) {
                        importScripts(...libraries);
                    }

                    // Use an async IIFE to support top-level await and capture promise results
                    const result = (async () => {
                        // "use strict"; is important for security and catching common errors.
                        return await eval("'use strict';" + code);
                    })();
                    
                    result.then(finalResult => {
                         let output = '';
                         if (logs.length > 0) {
                            output += 'Console Logs:\\n' + logs.join('\\n') + '\\n\\n';
                         }
                         // A result of \`undefined\` is common for code with only side effects (like console.log)
                         if (finalResult !== undefined) {
                            output += 'Return Value:\\n' + JSON.stringify(finalResult, null, 2);
                         } else if (logs.length === 0) {
                            output = 'Execution finished with no return value or console logs.';
                         }
                         self.postMessage({ result: output.trim() });
                    }).catch(err => {
                        self.postMessage({ error: err.toString() });
                    });

                } catch (err) {
                    self.postMessage({ error: err.toString() });
                }
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        const timeoutId = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve('Execution timed out after 5 seconds.');
        }, 5000);

        worker.onmessage = (e) => {
            clearTimeout(timeoutId);
            if (e.data.error) {
                resolve(`Execution failed: ${e.data.error}`);
            } else {
                resolve(e.data.result);
            }
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.onerror = (e) => {
            clearTimeout(timeoutId);
            resolve(`Worker error: ${e.message}`);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.postMessage({ code, libraries });
    });
};

export const executeCode = async (args: { language: string, code: string, libraries?: string[] }): Promise<string> => {
    const { language, code, libraries } = args;

    switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
        case 'typescript': // Treat TS as JS since we don't have a transpiler
        case 'ts':
            return executeJavaScript(code, libraries);
        default:
            return `Error: Language "${language}" is not supported. Only JavaScript and TypeScript (executed as JavaScript) are available in this sandboxed browser environment.`;
    }
};