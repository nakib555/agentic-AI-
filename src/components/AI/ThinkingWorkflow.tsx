/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode } from './WorkflowNode';
import { parseAgenticWorkflow } from '../../services/workflowParser';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { ActiveIcon, CompletedIcon, FailedIcon, GoalAnalysisIcon, TodoListIcon, ToolsIcon } from './icons';

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

const TopHeader = ({ duration, startTime, isThinkingComplete, isVisible, onToggleVisibility }: { 
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

const SectionHeader: React.FC<{
  title: string;
  isVisible: boolean;
  onToggle: () => void;
  statusIcon?: React.ReactNode;
  isLastSection?: boolean;
}> = ({ title, isVisible, onToggle, statusIcon, isLastSection }) => (
    <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2 cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors ${isLastSection ? 'rounded-b-xl' : ''}`}
        aria-expanded={isVisible}
        aria-controls={`${title.toLowerCase().replace(' ', '-')}-section`}
    >
        <div className="flex items-center gap-3">
            {statusIcon}
            <span className="font-semibold text-slate-200 text-sm">{title}</span>
        </div>
        <motion.div animate={{ rotate: isVisible ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
            </svg>
        </motion.div>
    </button>
);


type SectionKey = 'goal' | 'todo' | 'tools' | 'execution';

export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, error, duration, startTime, isVisible, onToggleVisibility }: ThinkingWorkflowProps) => {
  const [openSections, setOpenSections] = useState<SectionKey[]>(['goal', 'todo', 'execution']);

  const handleToggle = (key: SectionKey) => {
    setOpenSections(prevOpen => {
        if (prevOpen.includes(key)) {
            // It's open, so close it.
            return prevOpen.filter(k => k !== key);
        } else {
            // It's closed, so open it.
            const newOpen = [...prevOpen, key];
            // If this makes it more than 3, remove the oldest one from the queue.
            if (newOpen.length > 3) {
                return newOpen.slice(1);
            }
            return newOpen;
        }
    });
  };

  const { goalAnalysis, todoList, tools, executionLog } = useMemo(
    () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error), 
    [text, toolCallEvents, isThinkingComplete, error]
  );
  
  const executionLogRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (executionLogRef.current) {
      executionLogRef.current.scrollTop = executionLogRef.current.scrollHeight;
    }
  }, [executionLog]);

  const { executionHeaderTitle, executionStatusIcon } = useMemo(() => {
    if (!isThinkingComplete) return { executionHeaderTitle: 'Executing Tools', executionStatusIcon: <ActiveIcon /> };
    if (error) return { executionHeaderTitle: 'Execution Failed', executionStatusIcon: <FailedIcon /> };
    return { executionHeaderTitle: 'Execution Complete', executionStatusIcon: <CompletedIcon /> };
  }, [isThinkingComplete, error]);
  
  const hasGoalAnalysis = goalAnalysis.trim() !== '';
  const hasTodoList = todoList.trim() !== '';
  const hasTools = tools.trim() !== '';
  const hasExecutionLog = executionLog.length > 0;

  const visibleSections = [
    error && 'error',
    hasGoalAnalysis && 'goal',
    hasTodoList && 'todo',
    hasTools && 'tools',
    hasExecutionLog && 'execution',
  ].filter(Boolean);

  const lastVisibleSection = visibleSections[visibleSections.length - 1];

  const getSectionClassName = (sectionName: string) => {
    if (lastVisibleSection === sectionName) {
      return '';
    }
    return 'border-b border-slate-600/50';
  };

  const isGoalVisible = openSections.includes('goal');
  const isTodoVisible = openSections.includes('todo');
  const isToolsVisible = openSections.includes('tools');
  const isExecutionVisible = openSections.includes('execution');

  if (!hasGoalAnalysis && !hasTodoList && !hasTools && !hasExecutionLog && isThinkingComplete) {
      return null;
  }

  return (
    <div className="bg-[#2D2D2D] dark:bg-[#202123] rounded-xl max-w-[90%] w-full">
        <TopHeader 
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
                    className="overflow-y-auto flex flex-col max-h-[500px] workflow-container-log"
                >
                    {/* --- ERROR DISPLAY --- */}
                    {error && (
                        <div className={`p-4 ${getSectionClassName('error')}`}>
                             <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-red-900/30 border border-red-500/40 p-3 rounded-lg flex items-start gap-3"
                             >
                                <div className="flex-shrink-0 text-red-400 pt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-red-300 break-words">{error.message}</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    
                    {/* --- SECTION 1A: GOAL ANALYSIS --- */}
                    {hasGoalAnalysis && (
                        <div className={getSectionClassName('goal')}>
                            <SectionHeader
                                title="Goal Analysis"
                                isVisible={isGoalVisible}
                                onToggle={() => handleToggle('goal')}
                                statusIcon={<GoalAnalysisIcon />}
                                isLastSection={lastVisibleSection === 'goal'}
                            />
                            <AnimatePresence>
                                {isGoalVisible && (
                                    <motion.div
                                        id="goal-analysis-section"
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        variants={{
                                            open: { opacity: 1, height: 'auto', paddingBottom: '1rem' },
                                            collapsed: { opacity: 0, height: 0, paddingBottom: '0rem' }
                                        }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="px-4 pt-2 overflow-y-auto max-h-[240px] plan-log"
                                    >
                                        <ManualCodeRenderer text={goalAnalysis} components={WorkflowMarkdownComponents} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    
                    {/* --- SECTION 1B: TODO-LIST --- */}
                    {hasTodoList && (
                        <div className={getSectionClassName('todo')}>
                            <SectionHeader
                                title="Todo-list"
                                isVisible={isTodoVisible}
                                onToggle={() => handleToggle('todo')}
                                statusIcon={<TodoListIcon />}
                                isLastSection={lastVisibleSection === 'todo'}
                            />
                            <AnimatePresence>
                                {isTodoVisible && (
                                    <motion.div
                                        id="todo-list-section"
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        variants={{
                                            open: { opacity: 1, height: 'auto', paddingBottom: '1rem' },
                                            collapsed: { opacity: 0, height: 0, paddingBottom: '0rem' }
                                        }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="px-4 pt-2 overflow-y-auto max-h-[240px] plan-log"
                                    >
                                        <ManualCodeRenderer text={todoList} components={WorkflowMarkdownComponents} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* --- SECTION 1C: TOOLS --- */}
                    {hasTools && (
                        <div className={getSectionClassName('tools')}>
                            <SectionHeader
                                title="Tools"
                                isVisible={isToolsVisible}
                                onToggle={() => handleToggle('tools')}
                                statusIcon={<ToolsIcon />}
                                isLastSection={lastVisibleSection === 'tools'}
                            />
                            <AnimatePresence>
                                {isToolsVisible && (
                                    <motion.div
                                        id="tools-section"
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        variants={{
                                            open: { opacity: 1, height: 'auto', paddingBottom: '1rem' },
                                            collapsed: { opacity: 0, height: 0, paddingBottom: '0rem' }
                                        }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="px-4 pt-2 overflow-y-auto max-h-[240px] plan-log"
                                    >
                                        <ManualCodeRenderer text={tools} components={WorkflowMarkdownComponents} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}


                    {/* --- SECTION 2: EXECUTION LOG --- */}
                    {hasExecutionLog && (
                         <div className={`flex-1 flex flex-col min-h-0 ${getSectionClassName('execution')}`}>
                            <SectionHeader
                                title={executionHeaderTitle}
                                isVisible={isExecutionVisible}
                                onToggle={() => handleToggle('execution')}
                                statusIcon={executionStatusIcon}
                                isLastSection={lastVisibleSection === 'execution'}
                            />
                            <AnimatePresence>
                                {isExecutionVisible && (
                                    <motion.div
                                        id="execution-log-section"
                                        key="execution-content"
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        variants={{
                                            open: { opacity: 1, height: 'auto', flexGrow: 1 },
                                            collapsed: { opacity: 0, height: 0, flexGrow: 0 }
                                        }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden flex-1 flex flex-col"
                                    >
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
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};