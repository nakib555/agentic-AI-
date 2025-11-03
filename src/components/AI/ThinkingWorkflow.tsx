/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import { WorkflowNode, type WorkflowNodeData } from './WorkflowNode';
import { WorkflowConnector } from './WorkflowConnector';

type ThinkingWorkflowProps = {
  nodes: WorkflowNodeData[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onRegenerate?: (messageId: string) => void;
  messageId?: string;
};

const StatusIcon = ({ status }: { status: 'pending' | 'active' | 'done' | 'failed' }) => {
    switch (status) {
        case 'active': return <motion.div key="active" className="relative w-5 h-5 flex items-center justify-center"><motion.div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} /><motion.div className="absolute inset-0 w-full h-full bg-indigo-400/50 dark:bg-indigo-500/30 rounded-full" animate={{ scale: [0.8, 1.8], opacity: [0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} /></motion.div>;
        case 'done': return <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-green-500 dark:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg></motion.div>;
        case 'failed': return <motion.div key="failed" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-red-500 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg></motion.div>;
        default: return <motion.div className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-slate-200 dark:border-slate-500"></motion.div>;
    }
};

export const ThinkingWorkflow: React.FC<ThinkingWorkflowProps> = ({
  nodes,
  sendMessage,
  onRegenerate,
  messageId,
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const isLiveGeneration = nodes.some(node => node.status === 'active');

  useEffect(() => {
    if (isLiveGeneration && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [nodes, isLiveGeneration]);
  
  return (
    <div ref={logRef} className="font-['Inter',_sans-serif]">
        <div className="pl-2.5">
            {nodes.map((node, index) => (
                <div key={node.id} className="flex">
                    <div className="flex flex-col items-center mr-4">
                        <StatusIcon status={node.status} />
                        {index < nodes.length - 1 && (
                            <WorkflowConnector isActive={(node.status === 'done' || node.status === 'failed') && nodes[index + 1]?.status !== 'pending'} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-6">
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
                            >
                                <WorkflowNode node={node} sendMessage={sendMessage} onRegenerate={onRegenerate} messageId={messageId} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};