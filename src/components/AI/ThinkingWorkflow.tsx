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
import { TypingWrapper } from './TypingWrapper';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  error?: MessageError;
  duration: number | null;
  startTime?: number;
};

const TopHeader = ({ duration, startTime, isThinkingComplete, isDetailsVisible, onToggle }: {
    duration: number | null,
    startTime?: number,
    isThinkingComplete: boolean,
    isDetailsVisible: boolean;
    onToggle: () => void;
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
            onClick={onToggle}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-t-xl hover:bg-white/5 transition-colors"
            aria-expanded={isDetailsVisible}
            aria-controls="thinking-details"
        >
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                    <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-slate-200 text-sm">Thought for {displayDuration}s</span>
            </div>
            <motion.div animate={{ rotate: isDetailsVisible ? 0 : -90 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </motion.div>
        </button>
    );
};

const SectionHeader: React.FC<{
  title: string;
  statusIcon?: React.ReactNode;
}> = ({ title, statusIcon }) => (
    <div className="w-full flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3">
            {statusIcon}
            <span className="font-semibold text-slate-200 text-sm">{title}</span>
        </div>
    </div>
);


export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, error, duration, startTime }: ThinkingWorkflowProps) => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(true);

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

    const hasAnyContent = goalAnalysis || todoList || tools || executionLog.length > 0 || !!error;

    if (!hasAnyContent) {
        return null;
    }

    const visibleSections = [
        error && 'error',
        goalAnalysis && 'goal',
        todoList && 'todo',
        tools && 'tools',
        executionLog.length > 0 && 'execution',
    ].filter(Boolean);

    const lastVisibleSection = visibleSections[visibleSections.length - 1];

    const getSectionClassName = (sectionName: string) => {
        if (lastVisibleSection === sectionName) {
            return '';
        }
        return 'border-b border-slate-600/50';
    };

    const renderSectionContent = (content: string) => (
         <div className="px-4 pt-2 pb-4 overflow-y-auto max-h-[240px] plan-log">
            <TypingWrapper
                fullText={content}
                isComplete={isThinkingComplete}
            >
                {(text) => <ManualCodeRenderer text={text} components={WorkflowMarkdownComponents} />}
            </TypingWrapper>
        </div>
    );

    return (
        <div className="bg-[#2D2D2D] dark:bg-[#202123] rounded-xl max-w-[90%] w-full">
            <TopHeader
                duration={duration}
                startTime={startTime}
                isThinkingComplete={isThinkingComplete}
                isDetailsVisible={isDetailsVisible}
                onToggle={() => setIsDetailsVisible(!isDetailsVisible)}
            />

            <AnimatePresence>
            {isDetailsVisible && (
                <motion.div
                    id="thinking-details"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { opacity: 1, height: 'auto' },
                      collapsed: { opacity: 0, height: 0 }
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                <div className="overflow-y-auto flex flex-col max-h-[500px] workflow-container-log">
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

                    {goalAnalysis && (
                        <div className={getSectionClassName('goal')}>
                            <SectionHeader
                                title="Goal Analysis"
                                statusIcon={<GoalAnalysisIcon />}
                            />
                            {renderSectionContent(goalAnalysis)}
                        </div>
                    )}

                    {todoList && (
                        <div className={getSectionClassName('todo')}>
                            <SectionHeader
                                title="Todo-list"
                                statusIcon={<TodoListIcon />}
                            />
                            {renderSectionContent(todoList)}
                        </div>
                    )}

                    {tools && (
                        <div className={getSectionClassName('tools')}>
                            <SectionHeader
                                title="Tools"
                                statusIcon={<ToolsIcon />}
                            />
                            {renderSectionContent(tools)}
                        </div>
                    )}

                    {executionLog.length > 0 && (
                         <div className={`flex-1 flex flex-col min-h-0 ${getSectionClassName('execution')}`}>
                            <SectionHeader
                                title={executionHeaderTitle}
                                statusIcon={executionStatusIcon}
                            />
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
                        </div>
                    )}
                </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
