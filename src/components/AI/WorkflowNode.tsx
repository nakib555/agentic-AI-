/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { TypingWrapper } from './TypingWrapper';
import { ObservationIcon, SearchIcon, TodoListIcon, HandoffIcon, ValidationIcon, CorrectionIcon, ExecutorIcon } from './icons';
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

    switch (node.type) {
        case 'plan':
            icon = <TodoListIcon />;
            break;
        case 'duckduckgoSearch':
            icon = <SearchIcon />;
            title = `Search: "${node.title}"`;
            break;
        case 'tool':
            const toolEvent = node.details as ToolCallEvent;
            icon = <ExecutorIcon />;
            title = `Tool: ${toolEvent.call.name}`;
            break;
        case 'validation':
            icon = <ValidationIcon />;
            break;
        case 'correction':
            icon = <CorrectionIcon />;
            break;
        case 'thought':
            icon = <ExecutorIcon />;
            break;
        default:
            icon = <TodoListIcon />; // Fallback icon
            break;
    }

    return { icon, title };
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
    // This retains its boxed appearance for clarity as requested.
    if (node.type === 'duckduckgoSearch') {
        const event = node.details as ToolCallEvent;
        
        const query = (event?.call?.args?.query as string) || node.title;
        let sources: { uri: string; title: string; }[] | undefined = undefined;

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
                    sources = [];
                }
            } else {
                sources = [];
            }
        }
        
        return <SearchToolResult query={query} sources={sources} />;
    }
    
    // "Thought" nodes are rendered as simple text blocks without a container.
    if (node.type === 'thought') {
        const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : null;
        return (
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                    <ExecutorIcon />
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

    // "Observation" nodes are also rendered without a distinct container.
    if (node.type === 'observation') {
        return (
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
        );
    }
    
    // --- Default rendering for all other tool calls and tasks ---
    const { icon, title } = getNodeVisuals(node);
    const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : null;
    const hasDetails = !!node.details;

    return (
        <motion.div layout className="w-full">
            <div className="flex items-center justify-between gap-2">
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
                </div>
            </div>

            {hasDetails && (
                <div className="pl-8 pt-2">
                    {renderDetails(node, sendMessage)}
                </div>
            )}
        </motion.div>
    );
};