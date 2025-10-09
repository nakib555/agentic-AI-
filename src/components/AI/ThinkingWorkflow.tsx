/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode } from './WorkflowNode';
import { parseAgenticWorkflow, ParsedWorkflow } from '../../services/workflowParser';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  error?: MessageError;
  duration: number | null;
  startTime?: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
};

const Header = ({ duration, startTime, isThinkingComplete, isVisible, onToggleVisibility }: { 
    duration: number | null, 
    startTime?: number, 
    isThinkingComplete: boolean,
    isVisible: boolean,
    onToggleVisibility: () => void,
}) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        setElapsed(0); // Reset on new thinking process
        if (!isThinkingComplete && startTime) {
            const timer = setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime) / 1000);
                setElapsed(seconds);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isThinkingComplete, startTime]);
    
    const displayDuration = isThinkingComplete && duration !== null ? duration.toFixed(1) : elapsed;

    return (
        <button 
            onClick={onToggleVisibility}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors rounded-t-xl"
            aria-expanded={isVisible}
            aria-controls="thinking-details"
        >
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                    <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-slate-200 text-sm">Thought for {displayDuration}s</span>
            </div>
            <motion.div animate={{ rotate: isVisible ? -180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </motion.div>
        </button>
    );
};


export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, error, duration, startTime, isVisible, onToggleVisibility }: ThinkingWorkflowProps) => {
  const { plan, executionLog } = useMemo(
    () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error), 
    [text, toolCallEvents, isThinkingComplete, error]
  );
  
  const executionLogRef = useRef<HTMLUListElement>(null);

  // Auto-scroll the execution log to the bottom when new items are added.
  useEffect(() => {
    if (executionLogRef.current) {
      executionLogRef.current.scrollTop = executionLogRef.current.scrollHeight;
    }
  }, [executionLog]);

  if (plan.trim() === '' && executionLog.length === 0 && isThinkingComplete) {
      return null;
  }

  return (
    <div className="bg-[#2D2D2D] dark:bg-[#202123] rounded-xl max-w-[90%] w-full">
        <Header 
            duration={duration} 
            startTime={startTime} 
            isThinkingComplete={isThinkingComplete}
            isVisible={isVisible}
            onToggleVisibility={onToggleVisibility}
        />
      
        <AnimatePresence initial={false}>
            {isVisible && (
                <motion.div
                    id="thinking-details"
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                        open: { opacity: 1, height: 'auto' },
                        collapsed: { opacity: 0, height: 0 }
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden flex flex-col max-h-[500px]"
                >
                    {/* --- SECTION 1: PLANNING --- */}
                    <div className="px-4 pt-2 pb-4 border-b border-slate-600/50">
                        <ManualCodeRenderer text={plan} components={WorkflowMarkdownComponents} />
                    </div>

                    {/* --- SECTION 2: EXECUTION LOG --- */}
                    <ul ref={executionLogRef} className="flex-1 flex flex-col w-full gap-4 p-4 overflow-y-auto execution-log">
                        <AnimatePresence>
                            {executionLog.map((node) => (
                                <motion.li
                                    key={node.id}
                                    layout="position"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }}
                                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] } }}
                                    className="w-full flex flex-col items-start"
                                >
                                    <WorkflowNode node={node} />
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};