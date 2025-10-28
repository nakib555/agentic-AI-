/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../../types';
import { WorkflowNode } from './WorkflowNode';
import { parseAgenticWorkflow } from '../../services/workflowParser';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { ActiveIcon, CompletedIcon, FailedIcon, GoalAnalysisIcon, TodoListIcon, ToolsIcon } from './icons';
import { TypingWrapper } from './TypingWrapper';
import { WorkflowConnector } from './WorkflowConnector';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  isLiveGeneration: boolean;
  error?: MessageError;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

const StatusIcon = ({ status }: { status: 'pending' | 'active' | 'done' | 'failed' }) => {
    switch (status) {
        case 'active': return <ActiveIcon />;
        case 'done': return <CompletedIcon />;
        case 'failed': return <FailedIcon />;
        default: return <motion.div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full" />;
    }
};

const PlanSection: React.FC<{ icon: React.ReactNode; title: string; content: string; isLive: boolean; }> = ({ icon, title, content, isLive }) => {
    if (!content) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{title}</h3>
            </div>
            <div className="pl-7 text-sm text-gray-600 dark:text-slate-400 workflow-markdown">
                <TypingWrapper fullText={content} isAnimating={isLive}>
                    {(text) => <ManualCodeRenderer text={isLive ? text : content} components={WorkflowMarkdownComponents} isStreaming={isLive} />}
                </TypingWrapper>
            </div>
        </div>
    );
};

export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, isLiveGeneration, error, sendMessage }: ThinkingWorkflowProps) => {
    const executionLogRef = useRef<HTMLDivElement>(null);
    const lastExecutionLogLength = useRef(0);

    const { goalAnalysis, todoList, tools, executionLog } = useMemo(
        () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error),
        [text, toolCallEvents, isThinkingComplete, error]
    );

    // Auto-scroll the execution log to keep the latest step in view.
    useEffect(() => {
        if (executionLogRef.current && executionLog.length > lastExecutionLogLength.current) {
            executionLogRef.current.scrollTo({
                top: executionLogRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
        lastExecutionLogLength.current = executionLog.length;
    }, [executionLog]);

    const { executionHeaderTitle, executionStatusIcon } = useMemo(() => {
        if (!isThinkingComplete) return { executionHeaderTitle: 'Execution Log', executionStatusIcon: <ActiveIcon /> };
        if (error) return { executionHeaderTitle: 'Execution Failed', executionStatusIcon: <FailedIcon /> };
        return { executionHeaderTitle: 'Execution Complete', executionStatusIcon: <CompletedIcon /> };
    }, [isThinkingComplete, error]);

    const hasPlan = goalAnalysis || todoList || tools;
    const hasExecution = executionLog.length > 0;
    const hasAnyContent = hasPlan || hasExecution || !!error;

    if (!hasAnyContent) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 px-1 lg:px-4 h-full"
        >
            {/* Plan Column */}
            {hasPlan && (
                <div className="lg:col-span-5">
                    <div className="lg:sticky lg:top-4 self-start">
                         <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                            className="p-4 bg-white dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 space-y-4"
                        >
                            <div className="flex items-center gap-2">
                                <TodoListIcon />
                                <h2 className="font-semibold text-gray-800 dark:text-slate-200">The Plan</h2>
                            </div>
                            <PlanSection icon={<GoalAnalysisIcon />} title="Goal Analysis" content={goalAnalysis} isLive={isLiveGeneration} />
                            <PlanSection icon={<TodoListIcon />} title="Todo-list" content={todoList} isLive={isLiveGeneration} />
                            <PlanSection icon={<ToolsIcon />} title="Tools" content={tools} isLive={isLiveGeneration} />
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Execution Column */}
            <div className={hasPlan ? "lg:col-span-7" : "lg:col-span-12"}>
                 {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 p-3 rounded-lg flex items-start gap-3 mb-6"
                    >
                        <div className="flex-shrink-0 text-red-500 dark:text-red-400 pt-0.5">
                            <FailedIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-red-700 dark:text-red-300 break-words">{error.message}</p>
                        </div>
                    </motion.div>
                )}
                {hasExecution && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            {executionStatusIcon}
                            <h2 className="font-semibold text-gray-800 dark:text-slate-200">{executionHeaderTitle}</h2>
                        </div>
                        <ul className="flex flex-col w-full">
                            <AnimatePresence>
                                {executionLog.map((node, index) => {
                                    const isLastNode = index === executionLog.length - 1;
                                    const isActive = node.status === 'active';
                                    return (
                                        <motion.li
                                            key={node.id}
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: index * 0.05 } }}
                                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                            className="flex items-start gap-3 w-full"
                                        >
                                            <div className="flex flex-col items-center self-stretch">
                                                <StatusIcon status={node.status} />
                                                {!isLastNode && <WorkflowConnector isActive={isActive} />}
                                            </div>
                                            <div className={`flex-1 min-w-0 ${!isLastNode ? 'pb-8' : 'pb-1'}`}>
                                                <WorkflowNode node={node} sendMessage={sendMessage} />
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </AnimatePresence>
                        </ul>
                    </div>
                )}
            </div>
        </motion.div>
    );
};