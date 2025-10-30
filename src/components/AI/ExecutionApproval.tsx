/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { GoalAnalysisIcon, PlannerIcon, TodoListIcon, ToolsIcon } from './icons';
import type { ParsedWorkflow } from '../../services/workflowParser';
import { getAgentColor } from '../../utils/agentUtils';

type ExecutionApprovalProps = {
    plan: ParsedWorkflow;
    onApprove: () => void;
    onDeny: () => void;
};

const PlanSection: React.FC<{ icon: React.ReactNode; title: string; content: string; }> = ({ icon, title, content }) => {
    if (!content) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{title}</h3>
            </div>
            <div className="pl-7 text-sm text-gray-600 dark:text-slate-400 workflow-markdown">
                <ManualCodeRenderer text={content} components={WorkflowMarkdownComponents} isStreaming={false} />
            </div>
        </div>
    );
};

export const ExecutionApproval: React.FC<ExecutionApprovalProps> = ({ plan, onApprove, onDeny }) => {
    const plannerColor = getAgentColor('Planner');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[90%] flex flex-col gap-4 p-4 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10"
        >
            <div className="flex items-center gap-3">
                <PlannerIcon />
                <h2 className="font-semibold text-gray-800 dark:text-slate-200">Execution Plan</h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${plannerColor.bg} ${plannerColor.text}`}>
                    Planner
                </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-slate-400">
                The AI has formulated the following plan. Please review and approve to continue execution.
            </p>

            <div className="space-y-4 p-4 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10">
                <PlanSection icon={<GoalAnalysisIcon />} title="Goal Analysis" content={plan.goalAnalysis} />
                <PlanSection icon={<TodoListIcon />} title="Todo-list" content={plan.todoList} />
                <PlanSection icon={<ToolsIcon />} title="Tools" content={plan.tools} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={onDeny}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onApprove}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                    Approve & Continue
                </button>
            </div>
        </motion.div>
    );
};