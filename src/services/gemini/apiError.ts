/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Correct the relative import path for types.
import type { MessageError } from '../../types';

/**
 * Parses a generic Error from the Gemini API into a structured MessageError.
 * @param error The error object thrown by the API client.
 * @returns A structured MessageError with user-friendly content.
 */
export const parseApiError = (error: any): MessageError => {
    // Extract message, details, and status for robust classification
    let message = 'An unexpected API error occurred';
    let details = '';
    let status = '';
    
    if (error instanceof Error) {
        message = error.message;
        details = error.stack || error.toString();
    } else if (typeof error === 'object' && error !== null) {
        // Handle Google API's specific structured error response like:
        // {"error":{"code":429,"message":"...", "status":"RESOURCE_EXHAUSTED"}}
        if (error.error && typeof error.error.message === 'string') {
            message = error.error.message;
            if (error.error.status && typeof error.error.status === 'string') {
                status = error.error.status;
            }
        } else if (typeof error.message === 'string') {
            message = error.message;
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

    // 1. Invalid API Key
    if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('api key not found') || lowerCaseStatus === 'permission_denied') {
        return {
            code: 'INVALID_API_KEY',
            message: 'Invalid or Missing API Key',
            details: 'The API key is missing, invalid, or has expired. Please ensure it is configured correctly in your environment variables.'
        };
    }

    // 2. Rate Limiting / Quota Exceeded
    if (lowerCaseStatus === 'resource_exhausted' || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit')) {
        return {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API Rate Limit Exceeded',
            details: `You have sent too many requests or exceeded your quota. Please check your API plan and billing details. Original error: ${message}`
        };
    }
    
    // 3. Content Blocked by Safety Settings
    if (lowerCaseMessage.includes('response was blocked') || lowerCaseMessage.includes('safety policy')) {
        return {
            code: 'CONTENT_BLOCKED',
            message: 'Response Blocked by Safety Filter',
            details: 'The model\'s response was blocked due to the safety policy. This can happen if the prompt or the generated content is deemed unsafe. Please try rephrasing your request.'
        };
    }
    
    // 4. Model Not Found
    if (lowerCaseStatus === 'not_found' || lowerCaseMessage.includes('404') || lowerCaseMessage.includes('model not found')) {
        return {
            code: 'MODEL_NOT_FOUND',
            message: 'Model Not Found',
            details: `The model ID specified in the request could not be found. Please check the model name and ensure you have access to it. Original error: ${message}`
        };
    }
    
    // 5. Invalid Argument (e.g., malformed request)
    if (lowerCaseStatus === 'invalid_argument' || lowerCaseMessage.includes('400') || lowerCaseMessage.includes('bad request')) {
        return {
            code: 'INVALID_ARGUMENT',
            message: 'Invalid Request Sent',
            details: `The request was malformed or contained invalid parameters. Details: ${message}`
        };
    }

    // 6. Network Error
    if (lowerCaseMessage.includes('failed to fetch')) {
        return {
            code: 'NETWORK_ERROR',
            message: 'Network Error',
            details: `A network problem occurred, possibly due to a lost internet connection. Original error: ${details}`
        };
    }

    // Fallback for other generic API or network errors
    return {
        code: 'API_ERROR',
        message: message, // Use the extracted message
        details: details, // Use the extracted details
    };
};