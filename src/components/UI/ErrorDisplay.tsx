
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import type { MessageError } from '../../types';

const motion = motionTyped as any;

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
  onRetry?: () => void;
};

// Define variants for different error categories
type ErrorVariant = 'critical' | 'warning' | 'connection' | 'security' | 'tool' | 'info';

// Classify error codes into variants
const getErrorVariant = (code?: string): ErrorVariant => {
    if (!code) return 'critical';
    
    const codeUpper = code.toUpperCase();

    if (['INVALID_API_KEY', 'CONTENT_BLOCKED', 'PERMISSION_DENIED', 'ACCESS_DENIED'].some(c => codeUpper.includes(c))) {
        return 'security';
    }
    
    if (['NETWORK_ERROR', 'TIMEOUT', 'OFFLINE', 'FETCH_FAILED', 'DNS_ERROR'].some(c => codeUpper.includes(c))) {
        return 'connection';
    }

    if (['RATE_LIMIT_EXCEEDED', 'UNAVAILABLE', 'QUOTA_EXCEEDED', 'RESOURCE_EXHAUSTED'].some(c => codeUpper.includes(c))) {
        return 'warning';
    }
    
    if (codeUpper.startsWith('TOOL_') || ['PARSING_ERROR', 'EXECUTION_FAILED', 'INVALID_ARGUMENT'].some(c => codeUpper.includes(c))) {
        return 'tool';
    }

    if (['INFO', 'NOTICE'].some(c => codeUpper.includes(c))) {
        return 'info';
    }

    // Default to critical for generic API errors, crashes, or unknown codes
    return 'critical'; 
};


export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const suggestion = error.suggestion || getErrorMessageSuggestion(error.code);
    const variant = getErrorVariant(error.code);

    // Define distinct styles for each variant
    const variantStyles = {
        critical: {
            container: "bg-red-50/80 dark:bg-red-900/10 border-red-200/80 dark:border-red-800/50",
            iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
            title: "text-red-900 dark:text-red-200",
            code: "bg-red-100/50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
            text: "text-red-800 dark:text-red-300/90",
            detailsBtn: "text-red-700 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-red-900 dark:text-red-200 border-red-200/50 dark:border-red-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
            )
        },
        warning: {
            container: "bg-amber-50/80 dark:bg-amber-900/10 border-amber-200/80 dark:border-amber-800/50",
            iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
            title: "text-amber-900 dark:text-amber-200",
            code: "bg-amber-100/50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
            text: "text-amber-800 dark:text-amber-300/90",
            detailsBtn: "text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-amber-900 dark:text-amber-200 border-amber-200/50 dark:border-amber-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
            )
        },
        connection: {
            container: "bg-rose-50/80 dark:bg-rose-900/10 border-rose-200/80 dark:border-rose-800/50",
            iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
            title: "text-rose-900 dark:text-rose-200",
            code: "bg-rose-100/50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
            text: "text-rose-800 dark:text-rose-300/90",
            detailsBtn: "text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-rose-900 dark:text-rose-200 border-rose-200/50 dark:border-rose-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                    <path d="M20.25 2.25L3.75 21.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rose-500" />
                </svg>
            )
        },
        security: {
            container: "bg-purple-50/80 dark:bg-purple-900/10 border-purple-200/80 dark:border-purple-800/50",
            iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
            title: "text-purple-900 dark:text-purple-200",
            code: "bg-purple-100/50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
            text: "text-purple-800 dark:text-purple-300/90",
            detailsBtn: "text-purple-700 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-purple-900 dark:text-purple-200 border-purple-200/50 dark:border-purple-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.352-.272-2.636-.759-3.807a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
            )
        },
        tool: {
            container: "bg-cyan-50/80 dark:bg-cyan-900/10 border-cyan-200/80 dark:border-cyan-800/50",
            iconBg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
            title: "text-cyan-900 dark:text-cyan-200",
            code: "bg-cyan-100/50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
            text: "text-cyan-800 dark:text-cyan-300/90",
            detailsBtn: "text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-cyan-900 dark:text-cyan-200 border-cyan-200/50 dark:border-cyan-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1.006c.549.095.99.51.99 1.06l-.001 2.539a.75.75 0 01-1.5 0V6.066a47.623 47.623 0 00-17.783 0v2.294a.75.75 0 01-1.5 0V5.822c0-.55.441-.965.99-1.06A49.105 49.105 0 0111.25 3.756V3a.75.75 0 01.75-.75zm10.305 9.142c.117.696.195 1.405.195 2.108 0 5.26-3.809 9.65-8.74 10.415a.75.75 0 01-.768-.599l-.267-2.403c-.127-1.146-.987-2.074-2.123-2.292a.75.75 0 00-.394.052 6.093 6.093 0 01-2.43.05.75.75 0 00-.765.399l-1.094 2.22a.75.75 0 01-.864.382A10.475 10.475 0 011.5 13.5c0-.703.077-1.412.195-2.108.277-1.654 2.305-2.107 3.38-1.032.79.79 2.15.79 2.94 0l.443-.443c.59-.59 1.54-.59 2.131 0l1.398 1.398c.59.59 1.54.59 2.131 0l.443-.443c.79-.79 2.15-.79 2.94 0 1.075 1.075 3.103.622 3.38-1.032z" clipRule="evenodd" />
                </svg>
            )
        },
        info: {
            container: "bg-blue-50/80 dark:bg-blue-900/10 border-blue-200/80 dark:border-blue-800/50",
            iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
            title: "text-blue-900 dark:text-blue-200",
            code: "bg-blue-100/50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
            text: "text-blue-800 dark:text-blue-300/90",
            detailsBtn: "text-blue-700 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30",
            detailsBox: "bg-white/50 dark:bg-black/20 text-blue-900 dark:text-blue-200 border-blue-200/50 dark:border-blue-800/50",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
            )
        }
    };

    const styles = variantStyles[variant];
    const hasActions = error.details || onRetry;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`w-full border p-4 rounded-2xl shadow-sm backdrop-blur-sm ${styles.container}`}
        role="alert"
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full p-2.5 ${styles.iconBg}`}>
            {styles.icon}
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
                <p className={`text-sm mt-2 leading-relaxed font-medium ${styles.text}`}>
                    {suggestion}
                </p>
            )}

            {hasActions && (
              <div className="mt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {error.details && (
                            <button
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${styles.detailsBtn}`}
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 16 16" 
                                    fill="currentColor" 
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isDetailsOpen ? 'rotate-90' : ''}`}
                                >
                                    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                                <span className="whitespace-nowrap">{isDetailsOpen ? 'Hide Details' : 'View Details'}</span>
                            </button>
                        )}
                        
                        {error.details && (
                            <button
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(error, null, 2))}
                                className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${styles.detailsBtn}`}
                                title="Copy error details to clipboard"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                                    <path d="M4.75 2A1.75 1.75 0 0 0 3 3.75v8.5A1.75 1.75 0 0 0 4.75 14h6.5A1.75 1.75 0 0 0 13 12.25v-6.5L9.25 2H4.75ZM8.5 2.75V6H12v6.25a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-8.5a.25.25 0 0 1 .25-.25H8.5Z" />
                                </svg>
                                <span className="whitespace-nowrap">Copy</span>
                            </button>
                        )}
                    </div>

                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className={`text-xs font-semibold flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition-all ${styles.detailsBtn} border border-current/20 hover:bg-current/10 shadow-sm hover:shadow active:scale-95 flex-1 sm:flex-initial`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                            </svg>
                            <span className="whitespace-nowrap">Regenerate</span>
                        </button>
                    )}
                </div>
                
                {error.details && (
                    <AnimatePresence>
                      {isDetailsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-4 rounded-xl border text-xs whitespace-pre-wrap font-['Fira_Code',_monospace] overflow-x-auto shadow-inner ${styles.detailsBox}`}>
                            {error.details}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
};
