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
import { ActiveIcon, CompletedIcon, FailedIcon, GoalAnalysisIcon, PlannerIcon, TodoListIcon, ToolsIcon } from './icons';
import { TypingWrapper } from './TypingWrapper';
import { WorkflowConnector } from './WorkflowConnector';
import { getAgentColor } from '../../utils/agentUtils';
import { ErrorDisplay } from '../UI/ErrorDisplay';

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
        default: return <motion.div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></motion.div>;
    }
};

const PlanSection: React.FC<{ icon: React.ReactNode; title: string; content: string; isStreaming: boolean; }> = ({ icon, title, content, isStreaming }) => {
    if (!content) return null;
    const agentColor = getAgentColor('Planner');
    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">{title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${agentColor.bg} ${agentColor.text}`}>Planner</span>
                </div>
            </div>
            <div className="pl-8 text-sm text-gray-700 dark:text-slate-300 workflow-markdown">
                <TypingWrapper fullText={content} isAnimating={isStreaming}>
                    {(text) => <ManualCodeRenderer text={isStreaming ? text : content} components={WorkflowMarkdownComponents} isStreaming={isStreaming} />}
                </TypingWrapper>
            </div>
        </div>
    );
};


export const ThinkingWorkflow: React.FC<ThinkingWorkflowProps> = ({
  text,
  toolCallEvents = [],
  isThinkingComplete,
  isLiveGeneration,
  error,
  sendMessage,
}) => {
  const { goalAnalysis, todoList, tools, executionLog } = useMemo(
    () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error),
    [text, toolCallEvents, isThinkingComplete, error]
  );
  
  const executionLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLiveGeneration && executionLogRef.current) {
      executionLogRef.current.scrollTop = executionLogRef.current.scrollHeight;
    }
  }, [executionLog, isLiveGeneration]);
  
  const hasPlan = goalAnalysis || todoList || tools;

  return (
    <div className="px-4 pb-4">
      {error && (
         <div className="mb-6">
            <ErrorDisplay error={error} />
         </div>
      )}
      
      <div className="flex flex-col gap-8">
        {/* Plan Section */}
        {hasPlan && (
            <div className="space-y-6">
                <PlanSection icon={<PlannerIcon />} title="Plan" content={goalAnalysis} isStreaming={isLiveGeneration && !todoList} />
                <PlanSection icon={<TodoListIcon />} title="Todo-list" content={todoList} isStreaming={isLiveGeneration && !tools} />
                <PlanSection icon={<ToolsIcon />} title="Tools" content={tools} isStreaming={isLiveGeneration && executionLog.length === 0} />
            </div>
        )}

        {/* Execution Log Section */}
        {executionLog.length > 0 && (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <GoalAnalysisIcon />
                    <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">Execution Log</h3>
                </div>
                <div ref={executionLogRef} className="pl-2 space-y-4">
                    {executionLog.map((node, index) => (
                        <div key={node.id} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <StatusIcon status={node.status} />
                                {index < executionLog.length - 1 && (
                                    <WorkflowConnector isActive={node.status === 'done' && executionLog[index + 1]?.status !== 'pending'} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 * index }}
                                    >
                                        <WorkflowNode node={node} sendMessage={sendMessage} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};