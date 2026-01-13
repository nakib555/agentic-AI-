
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingWorkflow } from '../../AI/ThinkingWorkflow';
import type { WorkflowNodeData } from '../../../types';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const WorkflowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
);

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes, sendMessage, onRegenerate, messageId }) => {
    // Auto-expand if active, otherwise collapse by default for cleanliness
    const isActive = nodes.some(n => n.status === 'active');
    const [isExpanded, setIsExpanded] = useState(isActive);

    // Keep expanded if it becomes active
    useEffect(() => {
        if (isActive) setIsExpanded(true);
    }, [isActive]);

    return (
        <div className="w-full mb-6">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 overflow-hidden">
                {/* Header Toggle */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                            {isActive ? (
                                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <WorkflowIcon />
                            )}
                         </div>
                         <div className="flex flex-col items-start">
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                 Agent Workflow
                             </span>
                             {isActive && <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 animate-pulse">Executing...</span>}
                         </div>
                    </div>
                    
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400"
                    >
                        <ChevronDown />
                    </motion.div>
                </button>

                {/* Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="p-4 pt-2">
                                <ThinkingWorkflow
                                    plan={plan} // Pass plan into workflow to render as the first "Node"
                                    nodes={nodes}
                                    sendMessage={sendMessage}
                                    onRegenerate={onRegenerate}
                                    messageId={messageId}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
