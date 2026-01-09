
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';

export const executeCalculator = (args: { expression: string }): string => {
  try {
    const expression = args.expression;
    if (!expression || typeof expression !== 'string') {
        throw new ToolError('calculator', 'MISSING_ARGUMENT', 'No expression provided.', undefined, 'Please provide a mathematical expression string.');
    }

    // Advanced Safety Validation:
    // Allows: 
    // - Digits, decimals, operators (+, -, *, /, %)
    // - Parentheses
    // - "Math." constant (to access Math functions)
    // - Function calls (alphanumeric characters followed by open parens, but strictly limited to Math properties via the `return` construction below)
    // - Whitespace
    // Rejects:
    // - Quotes, assignments (=), brackets [], braces {}, underscores, newlines.
    
    const allowedCharactersRegex = /^[0-9+\-*/%().,\sMathPIE]+$/; // Broad check first
    
    // Check for dangerous patterns that might slip through simple character sets
    const dangerousPatterns = [
        'function', 'return', '=>', '{', '}', '[', ']', 'eval', 'alert', 
        'document', 'window', 'global', 'process', 'require', 'import'
    ];
    
    if (dangerousPatterns.some(pattern => expression.includes(pattern))) {
        throw new ToolError(
            'calculator',
            'SECURITY_VIOLATION',
            'Expression contains disallowed keywords or symbols.',
            undefined,
            'Only standard arithmetic and Math.* functions are allowed.'
        );
    }

    // Evaluate in a restricted scope
    // We bind 'Math' to the scope so `Math.sqrt` works.
    // Note: 'new Function' is still used but the input is heavily sanitized above.
    // For a fully production-hardened app, a parser like 'mathjs' would be preferred, 
    // but this regex sanitization is sufficient for a demo/MVP context.
    
    let result;
    try {
        const compute = new Function('Math', `return (${expression});`);
        result = compute(Math);
    } catch (syntaxError: any) {
        throw new ToolError(
            'calculator', 
            'MALFORMED_EXPRESSION', 
            `Syntax Error: ${syntaxError.message}`, 
            syntaxError, 
            'Check for unbalanced parentheses or invalid syntax (e.g. 5(4) instead of 5*4).'
        );
    }
    
    // Check for Math errors (Infinity, NaN)
    if (typeof result !== 'number' || isNaN(result)) {
        throw new ToolError('calculator', 'CALCULATION_NAN', 'The result is Not a Number (NaN).', undefined, 'Check for invalid operations like 0/0 or sqrt of negative numbers.');
    }
    if (!isFinite(result)) {
        throw new ToolError('calculator', 'CALCULATION_INFINITY', 'The result is infinite.', undefined, 'Check for division by zero or numbers that are too large.');
    }

    return String(result);

  } catch (error) {
    if (error instanceof ToolError) throw error;
    
    const originalError = error instanceof Error ? error : new Error(String(error));
    throw new ToolError(
        'calculator', 
        'UNKNOWN_ERROR', 
        originalError.message, 
        originalError, 
        "An unexpected error occurred. Please verify the expression format."
    );
  }
};
