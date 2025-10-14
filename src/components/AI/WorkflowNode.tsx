/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { TypingWrapper } from './TypingWrapper';
import { GoogleSearchIcon, ThoughtIcon, TodoListIcon, ToolsIcon } from './icons';

export type WorkflowNodeStatus = 'pending' | 'active' | 'done' | 'failed';
export type WorkflowNodeType = 'plan' | 'task' | 'tool' | 'googleSearch' | 'thought' | 'act_marker';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: WorkflowNodeStatus;
  details?: string | ToolCallEvent | MessageError;
  duration?: number | null;
};

const getNodeVisuals = (node: WorkflowNodeData) => {
    let icon: React.ReactNode;
    let title: string = node.title;
    let accentColor = 'slate';

    switch (node.type) {
        case 'plan':
            icon = <TodoListIcon />;
            accentColor = 'slate';
            break;
        case 'googleSearch':
            icon = <GoogleSearchIcon />;
            title = `Search: "${node.title}"`;
            accentColor = 'blue';
            break;
        case 'tool':
            const toolEvent = node.details as ToolCallEvent;
            icon = <ToolsIcon />;
            title = `Tool: ${toolEvent.call.name}`;
            accentColor = 'purple';
            if (toolEvent.call.name === 'generateImage') accentColor = 'indigo';
            if (toolEvent.call.name === 'generateVideo') accentColor = 'rose';
            if (toolEvent.call.name === 'executeCode') accentColor = 'gray';
            break;
        default:
            icon = <TodoListIcon />; // Fallback icon
            break;
    }

    if (node.status === 'failed') {
        accentColor = 'red';
    }

    return { icon, title, accentColor };
};


const renderDetails = (node: WorkflowNodeData) => {
    if (!node.details) return null;

    if (typeof node.details === 'object' && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} />;
    }

    if (node.status === 'failed' && typeof node.details === 'object' && 'message' in node.details) {
        const error = node.details as MessageError;
        return (
            <div className="text-sm space-y-1 text-red-300">
                <p><span className="font-semibold">Step Failed:</span> {error.message}</p>
                 <p className="text-xs text-red-400/80 mt-1">See the error summary above for more details.</p>
            </div>
        );
    }
    
    if (typeof node.details === 'string') {
        const detailsText = node.details;
        return (
            <div className="text-sm text-slate-300 workflow-markdown">
                <TypingWrapper
                    fullText={detailsText}
                    isAnimating={node.status === 'active'}
                >
                    {(text) => <ManualCodeRenderer text={node.status === 'active' ? text : detailsText} components={WorkflowMarkdownComponents} />}
                </TypingWrapper>
            </div>
        );
    }
    
    return null;
}

export const WorkflowNode = ({ node }: { node: WorkflowNodeData }) => {
    // This type is for internal processing and should not be rendered.
    if (node.type === 'act_marker') {
        return null;
    }
    
    // "Thought" nodes are rendered as simple text to distinguish them from "Action" cards.
    if (node.type === 'thought') {
        return (
            <div className="flex items-start gap-3 py-2 pl-1">
                <div className="flex-shrink-0 pt-0.5">
                    <ThoughtIcon />
                </div>
                <div className="text-sm text-slate-300 workflow-markdown">
                    <TypingWrapper
                        fullText={node.details as string}
                        isAnimating={node.status === 'active'}
                    >
                        {(text) => <ManualCodeRenderer text={node.status === 'active' ? text : node.details as string} components={WorkflowMarkdownComponents} />}
                    </TypingWrapper>
                </div>
            </div>
        );
    }
    
    const [isOpen, setIsOpen] = useState(true);
    const { icon, title, accentColor } = getNodeVisuals(node);

    const accentClasses: { [key: string]: string } = {
        slate: 'border-slate-600/50',
        blue: 'border-blue-500/50',
        purple: 'border-purple-500/50',
        indigo: 'border-indigo-500/50',
        rose: 'border-rose-500/50',
        gray: 'border-gray-500/50',
        red: 'border-red-500/50',
    };

    const hasDetails = !!node.details;

    return (
        <div className={`bg-black/20 rounded-lg border-l-4 ${accentClasses[accentColor] || 'border-slate-700'} w-full`}>
            <button
                onClick={() => hasDetails && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 p-3 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                aria-expanded={isOpen}
                disabled={!hasDetails}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <p className="font-medium text-slate-200 text-sm truncate">{title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {node.duration !== null && node.duration !== undefined && (
                        <span className="text-xs text-slate-400 font-mono">{node.duration.toFixed(1)}s</span>
                    )}
                    {hasDetails && (
                        <motion.div animate={{ rotate: isOpen ? 0 : -90 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </motion.div>
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && hasDetails && (
                    <motion.div
                        initial="collapsed" animate="open" exit="collapsed"
                        variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-700/50 px-4 pt-3 pb-4">
                            {renderDetails(node)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};