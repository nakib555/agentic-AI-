
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import { WorkflowNode } from './WorkflowNode';
import { WorkflowNodeData } from '../../types';
import { WorkflowConnector } from './WorkflowConnector';

type ThinkingWorkflowProps = {
  nodes: WorkflowNodeData[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onRegenerate?: (messageId: string) => void;
  messageId?: string;
};

export const ThinkingWorkflow: React.FC<ThinkingWorkflowProps> = ({
  nodes,
  sendMessage,
  onRegenerate,
  messageId,
}) => {
  return (
    <div className="font-['Inter',_sans-serif] w-full max-w-4xl mx-auto">
        <div className="relative">
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                // A node is considered "active" contextually if it's the currently running step
                // or if it's the last step and finished successfully.
                const isActivePath = node.status === 'done' || node.status === 'active';
                const nextNodeActive = nodes[index + 1]?.status !== 'pending';

                return (
                    <div key={node.id} className="group relative flex gap-4">
                        {/* Timeline Spine Column */}
                        <div className="flex flex-col items-center flex-shrink-0 w-8">
                            {/* The Connector Line */}
                            {!isLast && (
                                <div className="absolute top-8 bottom-0 left-4 w-px -ml-[0.5px] h-full z-0">
                                    <WorkflowConnector isActive={isActivePath && nextNodeActive} />
                                </div>
                            )}
                            
                            {/* The Status Node/Icon */}
                            <div className="relative z-10 flex items-center justify-center w-8 h-8 mt-1 bg-gray-50 dark:bg-[#1e1e1e] rounded-full ring-4 ring-gray-50 dark:ring-[#1e1e1e]">
                                <StatusIndicator status={node.status} type={node.type} />
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0 pb-8 pt-1">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    initial={{ opacity: 0, x: -10, y: 5 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    <WorkflowNode 
                                        node={node} 
                                        sendMessage={sendMessage} 
                                        onRegenerate={onRegenerate} 
                                        messageId={messageId}
                                        isLast={isLast}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

// --- Sub-component for the Timeline Icon ---

const StatusIndicator = ({ status, type }: { status: string; type: string }) => {
    // Plan steps get a special clipboard look
    if (type === 'plan') {
        return (
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm border-2 ${status === 'done' ? 'bg-indigo-100 border-indigo-500 text-indigo-600' : 'border-slate-300 text-slate-400'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 1a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2-2Zm0 1.5a.5.5 0 0 1 .5.5v.5h-1V3a.5.5 0 0 1 .5-.5Z" /></svg>
            </div>
        );
    }

    switch (status) {
        case 'active': 
            return (
                <div className="relative w-4 h-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white dark:border-slate-800"></span>
                </div>
            );
        case 'done': 
            return (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                </div>
            );
        case 'failed': 
            return (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </div>
            );
        default: 
            return (
                <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full ring-2 ring-white dark:ring-slate-800"></div>
            );
    }
};