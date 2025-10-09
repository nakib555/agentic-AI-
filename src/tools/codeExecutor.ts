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
        description: 'The programming language of the code block (e.g., "javascript", "python").'
      },
      code: {
        type: Type.STRING,
        description: 'The code snippet to execute.'
      },
    },
    required: ['language', 'code'],
  },
};

const executeJavaScript = (code: string): Promise<string> => {
    return new Promise((resolve) => {
        // Use a Web Worker for sandboxed execution
        const workerCode = `
            self.onmessage = function(e) {
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
                    // Use an async IIFE to support top-level await and capture promise results
                    const result = (async () => {
                        return await eval(e.data);
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

        worker.postMessage(code);
    });
};

// Mock a simple factorial function for the Python simulation
const factorial = (n: number): number => {
    if (n < 0) throw new Error("Factorial is not defined for negative numbers.");
    if (n === 0) return 1;
    return n * factorial(n - 1);
};

const executePythonMock = (code: string): string => {
    // Simulate a very basic Python interpreter for demonstration purposes.
    const printRegex = /print\((.*?)\)/;
    const factorialRegex = /factorial\(([0-9]+)\)/;
    
    if (printRegex.test(code)) {
        const match = code.match(printRegex);
        if (match && match[1]) {
            const content = match[1].replace(/['"]/g, ''); // remove quotes
            return `Console output: ${content}`;
        }
    }

    if (factorialRegex.test(code)) {
        const match = code.match(factorialRegex);
        if (match && match[1]) {
            try {
                const num = parseInt(match[1], 10);
                return `Result: ${factorial(num)}`;
            } catch (e: any) {
                return `Error: ${e.message}`;
            }
        }
    }
    
    return "Error: This is a mock Python environment and only supports 'print(\"text\")' and 'factorial(number)'.";
};

export const executeCode = async (args: { language: string, code: string }): Promise<string> => {
    const { language, code } = args;

    switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
            return executeJavaScript(code);
        case 'python':
        case 'py':
            return executePythonMock(code);
        default:
            return `Error: Language "${language}" is not supported. Supported languages are JavaScript and Python (mock).`;
    }
};