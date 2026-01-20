
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowNodeData } from '../../types';
import { AgentBriefing } from './AgentBriefing';

type ThinkingWorkflowProps = {
  plan?: string;
  nodes: WorkflowNodeData[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onRegenerate?: (messageId: string) => void;
  messageId?: string;
};

export const ThinkingWorkflow: React.FC<ThinkingWorkflowProps> = ({
  plan,
  nodes,
  sendMessage,
  onRegenerate,
  messageId,
}) => {
  return (
    <div className="relative pl-4 sm:pl-6">
        {/* Continuous Timeline Spine */}
        <div className="absolute left-[27px] sm:left-[35px] top-2 bottom-4 w-px bg-slate-200 dark:bg-white/10" />

        <div className="space-y-6">
            {/* Phase 1: Strategic Plan (If exists) */}
            {plan && (
                <div className="relative z-10">
                   <div className="absolute -left-[27px] sm:-left-[35px] top-0 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-indigo-500 dark:border-indigo-400 ring-4 ring-white dark:ring-[#1a1a1a] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                        </div>
                   </div>
                   <div className="pl-2">
                        <AgentBriefing content={plan} />
                   </div>
                </div>
            )}

            {/* Phase 2: Execution Nodes */}
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                return (
                    <div key={node.id} className="relative z-10 group">
                        <WorkflowNode 
                            node={node} 
                            sendMessage={sendMessage} 
                            onRegenerate={onRegenerate} 
                            messageId={messageId}
                            isLast={isLast}
                        />
                    </div>
                );
            })}
        </div>
    </div>
  );
};
