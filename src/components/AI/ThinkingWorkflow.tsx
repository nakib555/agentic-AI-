
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
    <div className="relative flex flex-col gap-4">
        {/* Phase 1: Strategic Plan (If exists) */}
        {plan && (
            <div className="relative z-10 mb-2">
                <AgentBriefing content={plan} />
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
  );
};
