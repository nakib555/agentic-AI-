/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const calculatorDeclaration: FunctionDeclaration = {
  name: 'calculator',
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: { type: Type.STRING, description: 'The mathematical expression to evaluate, e.g., "2+2", "5*8/2".' },
    },
    required: ['expression'],
  },
};

export const executeCalculator = (args: { expression: string }): string => {
    try {
        // Basic validation to prevent access to global scope (e.g., 'window', 'document').
        // A proper math parsing library like 'math.js' is strongly recommended for production.
        if (/[a-zA-Z]/.test(args.expression)) {
            throw new Error("Invalid expression: Only numbers and operators are allowed.");
        }
        // WARNING: eval is unsafe and should be replaced with a safe math parser in production.
        return String(eval(args.expression));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Invalid mathematical expression.";
        throw new Error(errorMessage);
    }
};