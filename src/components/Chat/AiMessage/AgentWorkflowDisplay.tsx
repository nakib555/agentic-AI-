
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThinkingWorkflow } from '../../AI/ThinkingWorkflow';
import type { WorkflowNodeData } from '../../../types';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

const WorkflowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
);

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes, sendMessage, onRegenerate, messageId }) => {
    const isActive = nodes.some(n => n.status === 'active');

    return (
        <div className="w-full mb-6">
            <div className="relative border-l-2 border-indigo-100 dark:border-white/10 ml-3 pl-6 py-2">
                {/* Header Badge */}
                <div className="absolute -left-[9px] top-0 bg-page py-1">
                    <div className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm
                        ${isActive 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' 
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }
                    `}>
                        {isActive ? (
                            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <WorkflowIcon />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wide">
                            Agent Workflow
                        </span>
                    </div>
                </div>
                
                {/* Content Stream */}
                <div className="mt-10">
                     <ThinkingWorkflow
                        plan={plan}
                        nodes={nodes}
                        sendMessage={sendMessage}
                        onRegenerate={onRegenerate}
                        messageId={messageId}
                    />
                </div>
            </div>
        </div>
    );
};
