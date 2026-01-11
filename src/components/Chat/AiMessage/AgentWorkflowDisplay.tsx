
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThinkingWorkflow } from '../../AI/ThinkingWorkflow';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../../Markdown/markdownComponents';
import type { WorkflowNodeData } from '../../../types';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes, sendMessage, onRegenerate, messageId }) => {
    return (
        <div className="w-full flex flex-col gap-4 mb-4">
            {/* Plan / Intent */}
            {plan && (
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                         <div className="text-sm text-slate-700 dark:text-slate-200 workflow-markdown leading-relaxed">
                            <ManualCodeRenderer text={plan} components={WorkflowMarkdownComponents} isStreaming={false} />
                        </div>
                    </div>
                </div>
            )}

            {/* Execution Steps */}
            {nodes.length > 0 && (
                <div className="pl-0 sm:pl-2">
                    <ThinkingWorkflow
                        nodes={nodes}
                        sendMessage={sendMessage}
                        onRegenerate={onRegenerate}
                        messageId={messageId}
                    />
                </div>
            )}
        </div>
    );
};
