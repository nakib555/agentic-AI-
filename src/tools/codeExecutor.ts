/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes a block of code in a specified language and returns the output. Supports `javascript` and `python` for simple, stateless scripts. Do not use for complex or multi-step programs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: {
        type: Type.STRING,
        description: "The programming language of the code to execute, e.g., 'javascript', 'python'."
      },
      code: {
        type: Type.STRING,
        description: 'The code snippet to execute.'
      },
    },
    required: ['language', 'code'],
  },
};

// Mock code execution environment
export const executeCode = (args: { language: string, code: string }): string => {
  const { language, code } = args;

  console.log(`Executing ${language} code:\n${code}`);

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      try {
        // A safer way to evaluate JS than direct eval, but still risky in a real app.
        // Sandboxed execution using a Function constructor
        const result = new Function(`return (() => { ${code} })()`)();
        return `Result: ${String(result)}`;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        throw new Error(`JavaScript execution failed: ${errorMessage}`);
      }
    
    case 'python':
    case 'py':
      // Mocking Python execution for demonstration purposes
      if (code.trim() === "print('hello world')") {
        return 'hello world';
      }
      if (code.includes('prime')) {
        return `
[2, 3, 5, 7, 11, 13, 17, 19]
Note: This is a mocked execution of a prime number function.
        `;
      }
      return `[Mock Python Output for]:\n${code}`;

    default:
      throw new Error(`Unsupported language for execution: "${language}". Only JavaScript and Python are supported.`);
  }
};