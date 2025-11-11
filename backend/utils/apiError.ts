/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Copied from src/services/gemini/apiError.ts for backend use.

export type MessageError = {
    code?: string;
    message: string;
    details?: string;
    suggestion?: string;
};

export class ToolError extends Error {
    public cause?: Error;
    public code: string;
    public suggestion?: string;
    
    constructor(
        public toolName: string,
        code: string,
        public originalMessage: string,
        cause?: Error,
        suggestion?: string,
    ) {
        super(`Tool '${toolName}' failed with code ${code}. Reason: ${originalMessage}`);
        this.name = 'ToolError';
        this.code = `TOOL_${code}`;
        this.cause = cause;
        this.suggestion = suggestion;
    }
}


export const parseApiError = (error: any): MessageError => {
    if (error instanceof ToolError) {
        return {
            code: error.code,
            message: `Tool Execution Failed: ${error.toolName}`,
            details: error.cause ? `${error.originalMessage}\n\nCause:\n${error.cause.stack}` : error.originalMessage,
            suggestion: error.suggestion,
        };
    }
    
    let message = 'An unexpected API error occurred';
    let details = '';
    let status = '';
    
    if (error instanceof Error) {
        message = error.message;
        details = error.stack || error.toString();
    } else if (typeof error === 'object' && error !== null) {
        if ((error as any).error && typeof (error as any).error.message === 'string') {
            message = (error as any).error.message;
            if ((error as any).error.status && typeof (error as any).error.status === 'string') {
                status = (error as any).error.status;
            }
        } else if (typeof (error as any).message === 'string') {
            message = (error as any).message;
        }
        try {
            details = JSON.stringify(error, null, 2);
        } catch (e) {
            details = 'Could not stringify the error object.';
        }
    } else {
        message = String(error);
        details = String(error);
    }

    const lowerCaseMessage = message.toLowerCase();
    const lowerCaseStatus = status.toLowerCase();

    if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('api key not found') || lowerCaseStatus === 'permission_denied') {
        return {
            code: 'INVALID_API_KEY',
            message: 'Invalid or Missing API Key',
            details: 'The API key is missing, invalid, or has expired. Please ensure it is configured correctly in your environment variables.'
        };
    }

    if (lowerCaseStatus === 'resource_exhausted' || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit')) {
        return {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API Rate Limit Exceeded',
            details: `You have sent too many requests or exceeded your quota. Please check your API plan and billing details. Original error: ${message}`
        };
    }
    
    if (lowerCaseMessage.includes('response was blocked') || lowerCaseMessage.includes('safety policy')) {
        return {
            code: 'CONTENT_BLOCKED',
            message: 'Response Blocked by Safety Filter',
            details: 'The model\'s response was blocked due to the safety policy. This can happen if the prompt or the generated content is deemed unsafe. Please try rephrasing your request.'
        };
    }
    
    if (lowerCaseStatus === 'not_found' || lowerCaseMessage.includes('404') || lowerCaseMessage.includes('model not found')) {
        return {
            code: 'MODEL_NOT_FOUND',
            message: 'Model Not Found',
            details: `The model ID specified in the request could not be found. Please check the model name and ensure you have access to it. Original error: ${message}`
        };
    }
    
    if (lowerCaseStatus === 'invalid_argument' || lowerCaseMessage.includes('400') || lowerCaseMessage.includes('bad request')) {
        return {
            code: 'INVALID_ARGUMENT',
            message: 'Invalid Request Sent',
            details: `The request was malformed or contained invalid parameters. Details: ${message}`
        };
    }

    if (lowerCaseMessage.includes('failed to fetch')) {
        return {
            code: 'NETWORK_ERROR',
            message: 'Network Error',
            details: `A network problem occurred, possibly due to a lost internet connection. Original error: ${details}`
        };
    }

    return {
        code: 'API_ERROR',
        message: message,
        details: details,
    };
};