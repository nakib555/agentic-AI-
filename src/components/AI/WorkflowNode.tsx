/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { TypingWrapper } from './TypingWrapper';
import { ObservationIcon, SearchIcon, ThoughtIcon, TodoListIcon, ToolsIcon, HandoffIcon, ValidationIcon, CorrectionIcon } from './icons';
import { SearchToolResult } from './SearchToolResult';
import { getAgentColor } from '../../utils/agentUtils';


const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);


export type WorkflowNodeStatus = 'pending' | 'active' | 'done' | 'failed';
export type WorkflowNodeType = 'plan' | 'task' | 'tool' | 'duckduckgoSearch' | 'thought' | 'act_marker' | 'observation' | 'handoff' | 'validation' | 'approval' | 'correction' | 'archival' | 'audit';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: WorkflowNodeStatus;
  details?: string | ToolCallEvent | MessageError;
  duration?: number | null;
  agentName?: string;
  handoff?: { from: string; to: string };
};

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
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
        case 'duckduckgoSearch':
            icon = <SearchIcon />;
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
        case 'validation':
            icon = <ValidationIcon />;
            accentColor = 'cyan';
            break;
        case 'correction':
            icon = <CorrectionIcon />;
            accentColor = 'amber';
            break;
        case 'thought':
            icon = <ThoughtIcon />;
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


const renderDetails = (node: WorkflowNodeData, sendMessage: WorkflowNodeProps['sendMessage']) => {
    if (!node.details) return null;

    if (typeof node.details === 'object' && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} sendMessage={sendMessage} />;
    }

    if (node.status === 'failed' && typeof node.details === 'object' && 'message' in node.details) {
        const error = node.details as MessageError;
        return (
            <div className="text-sm space-y-1 text-red-700 dark:text-red-300">
                <p><span className="font-semibold">Step Failed:</span> {error.message}</p>
                 <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">See the error summary above for more details.</p>
            </div>
        );
    }
    
    if (typeof node.details === 'string') {
        const detailsText = node.details;
        return (
            <div className="text-sm text-gray-700 dark:text-slate-300 workflow-markdown">
                <TypingWrapper
                    fullText={detailsText}
                    isAnimating={node.status === 'active'}
                >
                    {(text) => <ManualCodeRenderer text={node.status === 'active' ? text : detailsText} components={WorkflowMarkdownComponents} isStreaming={node.status === 'active'} />}
                </TypingWrapper>
            </div>
        );
    }
    
    return null;
}

const HandoffNode: React.FC<{ from: string; to: string; details?: string; isStreaming: boolean }> = ({ from, to, details, isStreaming }) => {
    const fromColor = getAgentColor(from);
    const toColor = getAgentColor(to);
    return (
        <div className="flex items-center gap-3 py-2 pl-1">
            <div className="flex-shrink-0 pt-0.5"><HandoffIcon /></div>
            <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${fromColor.bg} ${fromColor.text}`}>{from}</span>
                    <span className="text-slate-400">→</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${toColor.bg} ${toColor.text}`}>{to}</span>
                </div>
                {details && (
                    <div className="text-slate-600 dark:text-slate-400 text-xs workflow-markdown">
                        <TypingWrapper fullText={details} isAnimating={isStreaming}>
                            {(text) => <ManualCodeRenderer text={isStreaming ? text : details as string} components={WorkflowMarkdownComponents} isStreaming={isStreaming} />}
                        </TypingWrapper>
                    </div>
                )}
            </div>
        </div>
    );
};


export const WorkflowNode = ({ node, sendMessage }: WorkflowNodeProps) => {
    // This type is for internal processing and should not be rendered.
    if (node.type === 'act_marker') {
        return null;
    }

    // --- Custom UI for Handoff Steps ---
    if (node.type === 'handoff' && node.handoff) {
        return <HandoffNode from={node.handoff.from} to={node.handoff.to} details={node.details as string} isStreaming={node.status === 'active'} />;
    }

    // --- Custom UI for DuckDuckGo Search Tool ---
    // Instead of a collapsible card, render the results directly.
    if (node.type === 'duckduckgoSearch') {
        const event = node.details as ToolCallEvent;
        
        // The definitive query is from the tool call arguments. Fall back to node title.
        const query = (event?.call?.args?.query as string) || node.title;
        let sources: { uri: string; title: string; }[] | undefined = undefined;

        // If the tool has finished, parse its result string to find the sources.
        if (event?.result) {
            const sourcesMatch = event.result.match(/\[SOURCES_PILLS\]([\s\S]*?)\[\/SOURCES_PILLS\]/s);
            if (sourcesMatch) {
                try {
                    const markdownContent = sourcesMatch[1];
                    const parsedSources: { uri: string; title: string; }[] = [];
                    const regex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
                    let match;
                    while ((match = regex.exec(markdownContent)) !== null) {
                        parsedSources.push({ title: match[1].trim(), uri: match[2].trim() });
                    }
                    sources = parsedSources;
                } catch (e) {
                    console.error("Failed to parse search results markdown:", e);
                    sources = []; // Error state: show no sources.
                }
            } else {
                sources = []; // Result exists but no sources tag: show no sources.
            }
        }
        
        // Always render SearchToolResult. It will show a loading state if `sources` is undefined.
        return <SearchToolResult query={query} sources={sources} />;
    }
    
    // "Thought" nodes are rendered as simple text to distinguish them from "Action" cards.
    if (node.type === 'thought') {
        const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : null;
        return (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-black/10 rounded-lg">
                <div className="flex-shrink-0 pt-0.5">
                    <ThoughtIcon />
                </div>
                <div className="flex-1 text-sm text-gray-700 dark:text-slate-300 workflow-markdown">
                    {agentColorInfo && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full mr-2 ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                            {node.agentName}
                        </span>
                    )}
                    <TypingWrapper
                        fullText={node.details as string}
                        isAnimating={node.status === 'active'}
                    >
                        {(text) => <ManualCodeRenderer text={node.status === 'active' ? text : node.details as string} components={WorkflowMarkdownComponents} isStreaming={node.status === 'active'} />}
                    </TypingWrapper>
                </div>
            </div>
        );
    }

    // "Observation" nodes are rendered in a distinct box to show the result of a tool call.
    if (node.type === 'observation') {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                        <ObservationIcon />
                    </div>
                    <div className="text-sm text-gray-700 dark:text-slate-300 workflow-markdown">
                        <TypingWrapper
                            fullText={node.details as string}
                            isAnimating={node.status === 'active'}
                        >
                            {(text) => <ManualCodeRenderer text={node.status === 'active' ? text : node.details as string} components={WorkflowMarkdownComponents} isStreaming={node.status === 'active'} />}
                        </TypingWrapper>
                    </div>
                </div>
            </div>
        );
    }
    
    const [isOpen, setIsOpen] = useState(true);
    const { icon, title, accentColor } = getNodeVisuals(node);
    const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : null;


    const accentClasses: { [key: string]: string } = {
        slate: 'border-gray-300 dark:border-slate-600/50',
        blue: 'border-blue-500/80',
        purple: 'border-purple-500/80',
        indigo: 'border-indigo-500/80',
        rose: 'border-rose-500/80',
        gray: 'border-gray-500/80',
        red: 'border-red-500/80',
        cyan: 'border-cyan-500/80',
        green: 'border-green-500/80',
        amber: 'border-amber-500/80',
    };
    
    const finalAccentClass = agentColorInfo ? agentColorInfo.border : accentClasses[accentColor] || 'border-gray-300';

    const hasDetails = !!node.details;

    return (
        <motion.div layout className={`bg-white dark:bg-black/20 rounded-lg border-l-4 ${finalAccentClass} w-full shadow-sm`}>
            <button
                onClick={() => hasDetails && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 p-3 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                aria-expanded={isOpen}
                disabled={!hasDetails}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0 flex items-center flex-wrap gap-x-2 gap-y-1">
                        {agentColorInfo && (
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                                {node.agentName}
                            </span>
                        )}
                        <p className="font-medium text-gray-800 dark:text-slate-200 text-sm truncate">{title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {node.duration !== null && node.duration !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">{node.duration.toFixed(1)}s</span>
                    )}
                    {hasDetails && (
                        <motion.div animate={{ rotate: isOpen ? 0 : -90 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-slate-400">
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
                        <div className="border-t border-gray-200 dark:border-slate-700/50 px-4 pt-3 pb-4">
                            {renderDetails(node, sendMessage)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
