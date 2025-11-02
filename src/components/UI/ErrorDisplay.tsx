/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageError } from '../../types';

export const getErrorMessageSuggestion = (code?: string): string | null => {
    switch (code) {
        case 'MODEL_NOT_FOUND':
            return 'The selected model could not be found. Please choose a different model from the selector at the top.';
        case 'INVALID_API_KEY':
            return 'Your API key is invalid or missing. Please ensure it is configured correctly.';
        case 'RATE_LIMIT_EXCEEDED':
            return 'You have sent too many requests. Please wait a moment before trying again.';
        case 'CONTENT_BLOCKED':
            return 'The response was blocked by the safety filter. Try rephrasing your request.';
        case 'TOOL_EXECUTION_FAILED':
            return 'A tool required by the AI failed to execute correctly. See details for more information.';
        case 'TOOL_NOT_FOUND':
            return 'The AI tried to use a tool that does not exist. This may be a model hallucination issue.';
        case 'GEOLOCATION_PERMISSION_DENIED':
            return 'To fix this, please allow location access in your browser settings and try your request again.';
        case 'GEOLOCATION_UNAVAILABLE':
            return 'Your location could not be determined. Please ensure you have a stable network connection and that location services are enabled on your device.';
        case 'GEOLOCATION_TIMEOUT':
            return 'The request for your location took too long. Please check your network connection and try again.';
        case 'NETWORK_ERROR':
            return 'A network problem occurred. Please check your internet connection and try again.';
        default:
            if (code?.startsWith('TOOL_')) {
                return 'An error occurred while the AI was using one of its tools. Check the details for more technical information.';
            }
            return 'There was an unexpected error. Please try your request again.';
    }
};

type ErrorDisplayProps = {
  error: MessageError;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const suggestion = getErrorMessageSuggestion(error.code);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-4 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-red-500 dark:text-red-400 pt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <p className="font-semibold text-red-800 dark:text-red-200 break-words">{error.message}</p>
              {error.code && <span className="text-xs font-mono bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-md flex-shrink-0">{error.code}</span>}
            </div>
            
            {suggestion && <p className="text-sm text-red-700 dark:text-red-300 mt-2">{suggestion}</p>}

            {error.details && (
              <>
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
                >
                  {isDetailsOpen ? 'Hide Details' : 'Show Details'}
                </button>
                <AnimatePresence>
                  {isDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap font-['Fira_Code',_monospace]">
                        {error.details}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };