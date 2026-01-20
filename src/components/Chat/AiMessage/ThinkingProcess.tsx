
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../../Markdown/markdownComponents';

type ThinkingProcessProps = {
    thinkingText: string;
    isThinking: boolean;
    startTime?: number;
    endTime?: number;
};

// Isolated timer component
const DurationTimer = ({ startTime, endTime, isThinking }: { startTime?: number, endTime?: number, isThinking: boolean }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        
        if (!isThinking && endTime) {
            setElapsed((endTime - startTime) / 1000);
            return;
        }

        if (isThinking) {
             setElapsed((Date.now() - startTime) / 1000);
             const interval = setInterval(() => {
                 setElapsed((Date.now() - startTime) / 1000);
             }, 100);
             return () => clearInterval(interval);
        }
    }, [isThinking, startTime, endTime]);

    if (!startTime) return null;
    return <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{elapsed.toFixed(1)}s</span>;
};

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinkingText, isThinking, startTime, endTime }) => {
    if (!thinkingText) return null;

    return (
        <div className="w-full mb-4">
            <div className="bg-slate-50/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className={`
                            flex items-center justify-center w-5 h-5 rounded transition-colors
                            ${isThinking 
                                ? 'text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-400 dark:text-slate-500'
                            }
                        `}>
                            {isThinking ? (
                                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13.5a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h3.75a.75.75 0 000-1.5h-3v-4.25z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Chain of Thought
                        </span>
                    </div>
                    
                    <DurationTimer startTime={startTime} endTime={endTime} isThinking={isThinking} />
                </div>

                {/* Content */}
                <div className="p-4 bg-slate-50 dark:bg-transparent">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 workflow-markdown leading-relaxed">
                        <ManualCodeRenderer 
                            text={thinkingText} 
                            components={WorkflowMarkdownComponents} 
                            isStreaming={isThinking} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
