/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError.ts';

export const executeCalculator = (args: { expression: string }): string => {
  try {
    const expression = args.expression;
    const safeExpressionRegex = /^[0-9+\-*/().\s]+$/;
    if (!safeExpressionRegex.test(expression)) {
      throw new Error('Invalid characters found in expression. Only numbers, operators (+, -, *, /), and parentheses are allowed.');
    }

    const result = new Function(`return ${expression}`)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('The expression resulted in an invalid number.');
    }

    return String(result);
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    throw new ToolError('calculator', 'CALCULATION_FAILED', originalError.message, originalError, "The calculation failed. Please ensure the expression is mathematically correct and only contains numbers, parentheses, and basic operators (+, -, *, /).");
  }
};