/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../../types';

export const calculatorDeclaration: FunctionDeclaration = {
  name: 'calculator',
  description: 'Evaluates a mathematical expression. Supports basic arithmetic operators (+, -, *, /), parentheses, and numbers.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: { type: Type.STRING, description: 'The mathematical expression to evaluate (e.g., "2 * (3 + 4)").' },
    },
    required: ['expression'],
  },
};

export const executeCalculator = (args: { expression: string }): string => {
  try {
    const expression = args.expression;
    // Strict validation to only allow numbers, operators, parentheses, and whitespace.
    // This is a security measure to prevent code injection.
    const safeExpressionRegex = /^[0-9+\-*/().\s]+$/;
    if (!safeExpressionRegex.test(expression)) {
      throw new Error('Invalid characters found in expression. Only numbers, operators (+, -, *, /), and parentheses are allowed.');
    }

    // The Function constructor is used here as a safer alternative to eval().
    // It executes the code in the global scope, not the local scope.
    // Combined with the regex validation, it provides a reasonable level of safety.
    const result = new Function(`return ${expression}`)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('The expression resulted in an invalid number.');
    }

    return String(result);
  } catch (error) {
     // The error here could be from the regex or the Function execution.
     // We wrap it in a ToolError to provide structured feedback to the agentic loop.
    const originalError = error instanceof Error ? error : new Error(String(error));
    throw new ToolError('calculator', 'CALCULATION_FAILED', originalError.message, originalError);
  }
};