/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useRef } from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode } from './WorkflowNode';
import { parseAgenticWorkflow } from '../../services/workflowParser';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
// FIX: Fix module import path for icons to point to the barrel file inside the 'icons' directory, resolving ambiguity with an empty 'icons.tsx' file.
import { PlannerIcon, TodoListIcon, ToolsIcon, GoalAnalysisIcon } from './icons/index';
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
        case 'active': return <motion.div key="active" className="relative w-5 h-5 flex items-center justify-center"><motion.div className="w-2.5 h-2.5 bg-primary rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} /><motion.div className="absolute inset-0 w-full h-full bg-primary/50 rounded-full" animate={{ scale: [0.8, 1.8], opacity: [0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} /></motion.div>;
        case 'done': return <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-green-500 dark:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg></motion.div>;
        case 'failed': return <motion.div key="failed" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-red-500 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg></motion.div>;
        default: return <motion.div className="w-2.5 h-2.5 bg-ui-300 rounded-full border-2 border-ui-200"></motion.div>;
    }
};

const PlanSection: React.FC<{ icon: React.ReactNode; title: string; content: string; isStreaming: boolean; }> = ({ icon, title, content, isStreaming }) => {
    if (!content) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-text-muted">{icon}</div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
                <div className="text-sm text-text-secondary workflow-markdown">
                    <TypingWrapper fullText={content} isAnimating={isStreaming}>
                        {(text) => <ManualCodeRenderer text={isStreaming ? text : content} components={WorkflowMarkdownComponents} isStreaming={isStreaming} />}
                    </TypingWrapper>
                </div>
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
  const plannerColor = getAgentColor('Planner');

  return (
    <div className="px-4 pb-4 font-['Inter',_sans-serif]">
      {error && (
         <div className="mb-6">
            <ErrorDisplay error={error} />
         </div>
      )}
      
      <div className="flex flex-col gap-6">
        {/* Plan Section */}
        {hasPlan && (
            <div className="p-4 bg-ui-100 rounded-xl border border-color space-y-4">
                 <div className="flex items-center gap-3 mb-4">
                    <PlannerIcon />
                    <h3 className="text-base font-bold text-text-primary">Mission Briefing</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${plannerColor.bg} ${plannerColor.text}`}>Planner</span>
                </div>
                <PlanSection icon={<GoalAnalysisIcon />} title="Goal Analysis" content={goalAnalysis} isStreaming={isLiveGeneration && !todoList} />
                <PlanSection icon={<TodoListIcon />} title="Task List" content={todoList} isStreaming={isLiveGeneration && !tools} />
                <PlanSection icon={<ToolsIcon />} title="Required Tools" content={tools} isStreaming={isLiveGeneration && executionLog.length === 0} />
            </div>
        )}

        {/* Execution Log Section */}
        {executionLog.length > 0 && (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted"><path d="M10.75 3.944v1.076a.75.75 0 0 0 1.5 0V3.34a5.526 5.526 0 0 0-3.32-1.018V3.5a.75.75 0 0 1-1.5 0v-.837a5.526 5.526 0 0 0-3.32 1.018v.598a.75.75 0 0 0 1.5 0V3.944c.541-.244 1.12-.403 1.72-.444a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75-.75c-.6 0-1.179.199-1.72.444v-.598a.75.75 0 0 0-1.5 0v.837a5.526 5.526 0 0 0 3.32 1.018v-1.17a.75.75 0 0 1 1.5 0v.837a5.526 5.526 0 0 0 3.32-1.018v-.598a.75.75 0 0 0-1.5 0v.598c-.541.244-1.12.403-1.72.444a.75.75 0 0 1-.75-.75V4.25a.75.75 0 0 1 .75-.75c.6 0 1.179-.199 1.72-.444Z" /></svg>
                    <h3 className="text-base font-bold text-text-primary">Execution Log</h3>
                </div>
                <div ref={executionLogRef} className="pl-2.5">
                    {executionLog.map((node, index) => (
                        <div key={node.id} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <StatusIcon status={node.status} />
                                {index < executionLog.length - 1 && (
                                    <WorkflowConnector isActive={node.status === 'done' && executionLog[index + 1]?.status !== 'pending'} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-6">
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
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