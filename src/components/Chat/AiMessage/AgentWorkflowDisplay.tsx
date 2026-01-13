
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
        <path d="M6 18a4 4 0 0 1-1.97-1.375" />
        <path d="M19.97 16.625A4.002 4.002 0 0 1 18 18" />
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
                                <BrainIcon />
                            )}
                         </div>
                         <div className="flex flex-col items-start">
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                 Chain of Thought
                             </span>
                             {isActive && <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 animate-pulse">Processing...</span>}
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
