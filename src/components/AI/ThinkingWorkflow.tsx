/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import { WorkflowNode } from './WorkflowNode';
import { WorkflowNodeData } from '../../types';

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
    <div className="font-['Inter',_sans-serif] w-full max-w-3xl mx-auto py-2">
        <div className="relative pl-2 sm:pl-0">
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                // A node is considered "active" contextually if it's the currently running step
                // or if it's the last step and finished successfully.
                const isActivePath = node.status === 'done' || node.status === 'active';
                
                return (
                    <div key={node.id} className="group relative flex gap-6">
                        {/* Timeline Spine Column */}
                        <div className="flex flex-col items-center flex-shrink-0 w-6">
                            {/* The Connector Line */}
                            {!isLast && (
                                <div className="absolute top-8 bottom-0 left-3 w-px bg-border-default h-full z-0 group-last:hidden">
                                    {isActivePath && node.status !== 'failed' && (
                                        <motion.div
                                            className="w-full bg-gradient-to-b from-primary-main/50 to-transparent"
                                            initial={{ height: 0 }}
                                            animate={{ height: '100%' }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}
                                </div>
                            )}
                            
                            {/* The Status Node/Icon */}
                            <div className="relative z-10 flex items-center justify-center w-6 h-6 mt-1.5 bg-layer-1 rounded-full ring-4 ring-layer-1">
                                <StatusIndicator status={node.status} type={node.type} />
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0 pb-10 pt-1">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
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
            <div className={`w-4 h-4 flex items-center justify-center rounded-sm ${status === 'done' ? 'text-primary-main' : 'text-content-tertiary'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 1a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2-2Zm0 1.5a.5.5 0 0 1 .5.5v.5h-1V3a.5.5 0 0 1 .5-.5Z" /></svg>
            </div>
        );
    }

    switch (status) {
        case 'active': 
            return (
                <div className="relative w-3 h-3 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-main opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-main"></span>
                </div>
            );
        case 'done': 
            return (
                <div className="w-4 h-4 bg-status-success-bg text-status-success-text rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                </div>
            );
        case 'failed': 
            return (
                <div className="w-4 h-4 bg-status-error-bg text-status-error-text rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </div>
            );
        default: 
            return (
                <div className="w-2.5 h-2.5 bg-border-strong rounded-full"></div>
            );
    }
};