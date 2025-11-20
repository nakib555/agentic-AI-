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
            return 'Your API key is invalid or missing. Please ensure it is configured correctly in Settings.';
        case 'RATE_LIMIT_EXCEEDED':
            return 'You have sent too many requests. Please wait a moment before trying again.';
        case 'UNAVAILABLE':
            return 'The AI model is currently experiencing high traffic. This is temporary - please try again in a few seconds.';
        case 'CONTENT_BLOCKED':
            return 'The response was blocked by the safety filter. Try rephrasing your request to be less sensitive.';
        case 'TOOL_EXECUTION_FAILED':
            return 'A tool required by the AI failed to execute correctly. See details for more information.';
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

// Define variants for different error severities
type ErrorVariant = 'critical' | 'warning' | 'info';

// Classify error codes into variants
const getErrorVariant = (code?: string): ErrorVariant => {
    if (!code) return 'critical';
    
    const criticalCodes = ['INVALID_API_KEY', 'MODEL_NOT_FOUND', 'API_ERROR', 'INVALID_ARGUMENT'];
    if (criticalCodes.includes(code)) {
        return 'critical';
    }

    const warningCodes = ['RATE_LIMIT_EXCEEDED', 'UNAVAILABLE', 'NETWORK_ERROR'];
    if (warningCodes.includes(code) || code.startsWith('TOOL_')) {
        return 'warning';
    }
    
    const infoCodes = ['CONTENT_BLOCKED'];
    if (infoCodes.includes(code)) {
        return 'info';
    }

    return 'critical'; // Default to critical for unknown codes
};


export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const suggestion = error.suggestion || getErrorMessageSuggestion(error.code);
    const variant = getErrorVariant(error.code);

    // Define distinct styles for each variant
    const variantStyles = {
        critical: {
            container: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/60 dark:border-red-500/30",
            iconBg: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
            title: "text-red-800 dark:text-red-200",
            code: "bg-red-200/50 dark:bg-red-900/60 text-red-700 dark:text-red-300 border-red-300/50 dark:border-red-700/50",
            text: "text-red-700 dark:text-red-300/90",
            detailsBtn: "text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30",
            detailsBox: "bg-red-100/50 dark:bg-red-950/30 text-red-900 dark:text-red-200 border-red-200/50 dark:border-red-800/50"
        },
        warning: {
            container: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/60 dark:border-amber-500/30",
            iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
            title: "text-amber-800 dark:text-amber-200",
            code: "bg-amber-200/50 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300/50 dark:border-amber-700/50",
            text: "text-amber-700 dark:text-amber-300/90",
            detailsBtn: "text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30",
            detailsBox: "bg-amber-100/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200/50 dark:border-amber-800/50"
        },
        info: {
             container: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/60 dark:border-blue-500/30",
             iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
             title: "text-blue-800 dark:text-blue-200",
             code: "bg-blue-200/50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/50",
             text: "text-blue-700 dark:text-blue-300/90",
             detailsBtn: "text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30",
             detailsBox: "bg-blue-100/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200/50 dark:border-blue-800/50"
        }
    };

    const styles = variantStyles[variant];

    // Select icon based on error type for better visual communication
    const renderIcon = () => {
        if (error.code === 'UNAVAILABLE') {
             // Server busy / Cloud icon
             return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" /></svg>;
        }
        if (variant === 'warning') {
            return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>;
        }
        if (variant === 'info') {
            return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>;
        }
        // Critical error default
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>;
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`w-full bg-gradient-to-br border p-4 rounded-2xl shadow-sm ${styles.container}`}
        role="alert"
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full p-2 ${styles.iconBg}`}>
            {renderIcon()}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className={`font-bold text-base ${styles.title} break-words leading-tight`}>
                  {error.message}
              </p>
              {error.code && (
                <span className={`text-[10px] tracking-wider font-mono font-bold px-2 py-1 rounded-md border uppercase ${styles.code}`}>
                  {error.code}
                </span>
              )}
            </div>
            
            {suggestion && (
                <p className={`text-sm mt-2 leading-relaxed ${styles.text}`}>
                    {suggestion}
                </p>
            )}

            {error.details && (
              <div className="mt-3">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-colors ${styles.detailsBtn}`}
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 16 16" 
                        fill="currentColor" 
                        className={`w-4 h-4 transition-transform duration-200 ${isDetailsOpen ? 'rotate-90' : ''}`}
                    >
                        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                    <span>{isDetailsOpen ? 'Hide Debug Info' : 'View Debug Info'}</span>
                </button>
                <AnimatePresence>
                  {isDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-3 rounded-lg border text-xs whitespace-pre-wrap font-['Fira_Code',_monospace] overflow-x-auto ${styles.detailsBox}`}>
                        {error.details}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
};
