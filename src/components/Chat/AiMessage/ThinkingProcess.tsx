
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../../Markdown/markdownComponents';

const motion = motionTyped as any;

type ThinkingProcessProps = {
    thinkingText: string;
    isThinking: boolean;
    duration?: string | number;
};

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinkingText, isThinking, duration }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Auto-open only on initial mount if actively thinking, but respect user toggling afterwards
    const hasAutoOpened = useRef(false);

    useEffect(() => {
        if (isThinking && !hasAutoOpened.current && thinkingText.length > 0) {
            setIsOpen(true);
            hasAutoOpened.current = true;
        }
        // Auto-collapse when done thinking
        if (!isThinking && hasAutoOpened.current) {
            setIsOpen(false);
        }
    }, [isThinking, thinkingText.length]);

    if (!thinkingText) return null;

    return (
        <div className="w-full mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200
                    ${isOpen 
                        ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10' 
                        : 'bg-slate-50 dark:bg-black/20 border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-md transition-colors
                        ${isThinking 
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' 
                            : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }
                    `}>
                        {isThinking ? (
                            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.08l5.925 2.848A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {isThinking ? 'Thinking Process' : 'Thought Process'}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {duration && (
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            {duration}s
                        </span>
                    )}
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-slate-50/50 dark:bg-black/10 rounded-b-xl border-x border-b border-slate-200 dark:border-white/10 -mt-1 mx-1"
                    >
                        <div className="p-4 pt-3">
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 workflow-markdown leading-relaxed">
                                <ManualCodeRenderer 
                                    text={thinkingText} 
                                    components={WorkflowMarkdownComponents} 
                                    isStreaming={isThinking} 
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
