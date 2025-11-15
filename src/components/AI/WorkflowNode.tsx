/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import type { MessageError, ToolCallEvent, WorkflowNodeData } from '../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { TypingWrapper } from './TypingWrapper';
import { ObservationIcon, SearchIcon, TodoListIcon, HandoffIcon, ValidationIcon, CorrectionIcon, ExecutorIcon, ThoughtIcon } from './icons/index';
import { SearchToolResult } from './SearchToolResult';
import { getAgentColor } from '../../utils/agentUtils';


type WorkflowNodeProps = {
  node: WorkflowNodeData;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onRegenerate?: (messageId: string) => void;
  messageId?: string;
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
            title = `Search`;
            break;
        case 'tool':
            icon = <ExecutorIcon />;
            title = `Tool: ${ (node.details as ToolCallEvent).call.name}`;
            break;
        case 'validation':
            icon = <ValidationIcon />;
            break;
        case 'correction':
            icon = <CorrectionIcon />;
            break;
        case 'thought':
            icon = <ThoughtIcon />;
            break;
        case 'observation':
            icon = <ObservationIcon />;
            break;
        default:
            icon = <TodoListIcon />; // Fallback icon
            break;
    }

    return { icon, title };
};


const renderDetails = (
    node: WorkflowNodeData,
    sendMessage: WorkflowNodeProps['sendMessage'],
    onRegenerate?: (messageId: string) => void,
    messageId?: string
) => {
    if (!node.details) return null;

    if (typeof node.details === 'object' && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} sendMessage={sendMessage} onRegenerate={onRegenerate} messageId={messageId} />;
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
                    delay={250}
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
                    <span className="text-slate-400 dark:text-slate-500 font-['Space_Grotesk']">→</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${toColor.bg} ${toColor.text}`}>{to}</span>
                </div>
                {details && (
                    <div className="text-slate-600 dark:text-slate-400 text-sm workflow-markdown">
                        <TypingWrapper fullText={details} isAnimating={isStreaming} delay={250}>
                            {(text) => <ManualCodeRenderer text={isStreaming ? text : details as string} components={WorkflowMarkdownComponents} isStreaming={isStreaming} />}
                        </TypingWrapper>
                    </div>
                )}
            </div>
        </div>
    );
};


export const WorkflowNode = ({ node, sendMessage, onRegenerate, messageId }: WorkflowNodeProps) => {
    // This type is for internal processing and should not be rendered.
    if (node.type === 'act_marker') {
        return null;
    }

    // --- Custom UI for Handoff Steps ---
    if (node.type === 'handoff' && node.handoff) {
        return <HandoffNode from={node.handoff.from} to={node.handoff.to} details={node.details as string} isStreaming={node.status === 'active'} />;
    }

    // --- Custom UI for DuckDuckGo Search Tool ---
    if (node.type === 'duckduckgoSearch') {
        const event = node.details as ToolCallEvent;
        const agentColorInfo = getAgentColor(node.agentName || 'Executor');
        const { icon, title } = getNodeVisuals(node);
        
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
                }
            }
        }
        
        return (
            <div className={`p-4 rounded-xl bg-white dark:bg-zinc-800/50 border ${agentColorInfo.border} shadow-sm`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                                {node.agentName}
                            </span>
                            <p className="font-semibold font-['Space_Grotesk'] text-gray-800 dark:text-slate-200 text-sm truncate">{title}</p>
                        </div>
                    </div>
                </div>
                <div className="pl-8">
                    <SearchToolResult query={node.title} sources={sources} />
                </div>
            </div>
        );
    }
    
    // --- Default rendering for all other tool calls and tasks ---
    const { icon, title } = getNodeVisuals(node);
    const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : null;
    const hasDetails = !!node.details;

    return (
        <motion.div layout className={`w-full p-4 rounded-xl bg-white dark:bg-zinc-800/50 border shadow-sm ${agentColorInfo ? agentColorInfo.border : 'border-slate-200 dark:border-zinc-700'}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0 flex items-center flex-wrap gap-x-2 gap-y-1">
                        {agentColorInfo && (
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                                {node.agentName}
                            </span>
                        )}
                        <p className="font-semibold font-['Space_Grotesk'] text-gray-800 dark:text-slate-200 text-sm truncate">{title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {node.duration !== null && node.duration !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">{node.duration.toFixed(1)}s</span>
                    )}
                </div>
            </div>

            {hasDetails && (
                <div className="pl-8 pt-3">
                    {renderDetails(node, sendMessage, onRegenerate, messageId)}
                </div>
            )}
        </motion.div>
    );
};