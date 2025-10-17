/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes JavaScript code in a secure, sandboxed browser environment. Can load external libraries via CDN URLs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: { 
        type: Type.STRING, 
        description: 'The programming language. Must be "javascript", "js", "typescript", or "ts".' 
      },
      code: { 
        type: Type.STRING, 
        description: 'The code to execute.' 
      },
      libraries: {
        type: Type.ARRAY,
        description: 'An optional array of CDN URLs for external libraries to load before execution (e.g., lodash, d3).',
        items: {
          type: Type.STRING
        }
      }
    },
    required: ['language', 'code'],
  },
};

const WORKER_TIMEOUT_MS = 30000; // 30 seconds timeout for the worker

export const executeCode = (args: { language: string; code: string; libraries?: string[] }): Promise<string> => {
  const { language, code, libraries = [] } = args;

  const supportedLanguages = ['javascript', 'js', 'typescript', 'ts'];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    return Promise.reject(new Error(`Language "${language}" is not supported. Please use JavaScript or TypeScript.`));
  }

  return new Promise((resolve, reject) => {
    // The worker code is created as a string and then converted to a Blob URL.
    // This worker has no access to the main thread's DOM or global variables.
    const workerCode = `
      self.consoleLogBuffer = [];
      const originalLog = console.log;
      console.log = (...args) => {
          self.consoleLogBuffer.push(args.map(arg => {
            try {
              // Attempt to stringify, handle circular references and complex objects
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }).join(' '));
          originalLog.apply(console, args);
      };

      self.onmessage = async (event) => {
        const { code, libraries } = event.data;
        
        try {
          if (libraries && libraries.length > 0) {
            await Promise.all(libraries.map(lib => importScripts(lib)));
          }
          
          // Use an async function to handle top-level await and wrap code
          const result = await (async () => {
            return eval(code);
          })();

          const finalResult = {
            logs: self.consoleLogBuffer,
            returnValue: result,
          };
          self.postMessage({ success: true, result: finalResult });

        } catch (error) {
          self.postMessage({ success: false, error: { message: error.message, stack: error.stack } });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Code execution timed out after ${WORKER_TIMEOUT_MS / 1000} seconds.`));
    }, WORKER_TIMEOUT_MS);

    worker.onmessage = (event) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      if (event.data.success) {
        const { logs, returnValue } = event.data.result;
        let output = '';
        if (logs.length > 0) {
            output += '### Logs\n---\n' + logs.map(l => '```\n' + l + '\n```').join('\n') + '\n\n';
        }
        
        const returnValueString = returnValue !== undefined ? JSON.stringify(returnValue, null, 2) : 'undefined';
        output += '### Return Value\n---\n```json\n' + returnValueString + '\n```';
        
        resolve(output.trim());
      } else {
        const { message } = event.data.error;
        reject(new Error(`Execution failed: ${message}`));
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.postMessage({ code, libraries });
  });
};