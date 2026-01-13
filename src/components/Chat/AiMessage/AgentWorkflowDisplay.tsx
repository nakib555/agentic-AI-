
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThinkingWorkflow } from '../../AI/ThinkingWorkflow';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../../Markdown/markdownComponents';
import type { WorkflowNodeData } from '../../../types';
import { AgentBriefing } from '../../AI/AgentBriefing';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes, sendMessage, onRegenerate, messageId }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="w-full flex flex-col gap-4 mb-6">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 14 2 9l3-9 9-3 9 3 3 9-9 5z"/></svg>
                     </div>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Mission Status</span>
                     
                     {nodes.some(n => n.status === 'active') && (
                         <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                         </span>
                     )}
                 </div>
                 
                 <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                 >
                     {isExpanded ? 'Collapse' : 'Expand'}
                 </button>
            </div>

            {isExpanded && (
                <div className="pl-2 border-l-2 border-slate-100 dark:border-white/5 space-y-6">
                    {/* Plan / Intent */}
                    {plan && (
                        <div className="mb-4">
                             <AgentBriefing content={plan} />
                        </div>
                    )}

                    {/* Execution Steps */}
                    {nodes.length > 0 && (
                        <div className="pl-1">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Execution Log</h4>
                            <ThinkingWorkflow
                                nodes={nodes}
                                sendMessage={sendMessage}
                                onRegenerate={onRegenerate}
                                messageId={messageId}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
