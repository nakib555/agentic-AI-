/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { GoalAnalysisIcon, PlannerIcon, TodoListIcon, ToolsIcon } from './icons/index';
import type { ParsedWorkflow } from '../../services/workflowParser';
import { getAgentColor } from '../../utils/agentUtils';

type ExecutionApprovalProps = {
    plan: ParsedWorkflow;
    onApprove: (editedPlan: string) => void;
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

const EditablePlanSection: React.FC<{ title: string, value: string, onChange: (value: string) => void }> = ({ title, value, onChange }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{title}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="mt-2 w-full min-h-[100px] p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-y"
            aria-label={`Edit ${title}`}
        />
    </div>
);

export const ExecutionApproval: React.FC<ExecutionApprovalProps> = ({ plan, onApprove, onDeny }) => {
    const plannerColor = getAgentColor('Planner');
    const [isEditing, setIsEditing] = useState(false);

    // Manually parse the plan sections from the raw text string.
    const rawPlanText = plan.plan || '';
    const goalAnalysisMatch = rawPlanText.match(/## Goal Analysis\s*([\s\S]*?)(?=## Todo-list|## Tools|$)/s);
    const todoListMatch = rawPlanText.match(/## Todo-list\s*([\s\S]*?)(?=## Tools|$)/s);
    const toolsMatch = rawPlanText.match(/## Tools\s*([\s\S]*?)$/s);
    
    const originalGoal = goalAnalysisMatch ? goalAnalysisMatch[1].trim() : '';
    const originalTodo = todoListMatch ? todoListMatch[1].trim() : '';
    const originalTools = toolsMatch ? toolsMatch[1].trim() : '';

    const [editedGoal, setEditedGoal] = useState(originalGoal);
    const [editedTodo, setEditedTodo] = useState(originalTodo);
    const [editedTools, setEditedTools] = useState(originalTools);

    const handleApprove = () => {
        const handoffMessage = "\n\n[STEP] Handoff: Planner -> Executor:\n[AGENT: Planner] The user-approved plan is ready for execution.";
        const fullEditedPlan = `## Goal Analysis\n${editedGoal}\n\n## Todo-list\n${editedTodo}\n\n## Tools\n${editedTools}${handoffMessage}`;
        onApprove(fullEditedPlan);
    };

    const handleReset = () => {
        setEditedGoal(originalGoal);
        setEditedTodo(originalTodo);
        setEditedTools(originalTools);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col gap-4 p-4 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10"
        >
            <div className="flex items-center gap-3">
                <PlannerIcon />
                <h2 className="font-semibold text-gray-800 dark:text-slate-200">Execution Plan</h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${plannerColor.bg} ${plannerColor.text}`}>
                    Planner
                </span>
            </div>
            
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                    Review the plan below. You can edit it before approving.
                </p>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-md hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30">
                        Edit Plan
                    </button>
                )}
            </div>

            <div className="space-y-4 p-4 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10">
                {isEditing ? (
                    <>
                        <EditablePlanSection title="Goal Analysis" value={editedGoal} onChange={setEditedGoal} />
                        <EditablePlanSection title="Todo-list" value={editedTodo} onChange={setEditedTodo} />
                        <EditablePlanSection title="Tools" value={editedTools} onChange={setEditedTools} />
                    </>
                ) : (
                    <>
                        <PlanSection icon={<GoalAnalysisIcon />} title="Goal Analysis" content={editedGoal} />
                        <PlanSection icon={<TodoListIcon />} title="Todo-list" content={editedTodo} />
                        <PlanSection icon={<ToolsIcon />} title="Tools" content={editedTools} />
                    </>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                {isEditing && (
                    <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200/50 dark:hover:bg-black/20 rounded-lg transition-colors">
                        Reset
                    </button>
                )}
                <button
                    onClick={onDeny}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApprove}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                    Approve & Continue
                </button>
            </div>
        </motion.div>
    );
};