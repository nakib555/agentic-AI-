
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, memo } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import type { MessageError, ToolCallEvent, WorkflowNodeData } from '../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { ObservationIcon, SearchIcon, TodoListIcon, HandoffIcon, ValidationIcon, CorrectionIcon, ExecutorIcon, ThoughtIcon } from './icons/index';
import { SearchToolResult } from './SearchToolResult';
import { getAgentColor } from '../../utils/agentUtils';
import { FlowToken } from './FlowToken';

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onRegenerate?: (messageId: string) => void;
  messageId?: string;
  isLast?: boolean;
};

// Helper to map node types to visual properties
const getNodeVisuals = (node: WorkflowNodeData) => {
    let icon: React.ReactNode;
    let title: string = node.title;
    let typeLabel = "System";

    switch (node.type) {
        case 'plan':
            icon = <TodoListIcon />;
            typeLabel = "Plan";
            break;
        case 'duckduckgoSearch':
            icon = <SearchIcon />;
            title = `Searching for "${node.title}"`;
            typeLabel = "Tool";
            break;
        case 'tool':
            icon = <ExecutorIcon />;
            const toolName = (node.details as ToolCallEvent)?.call?.name || 'Tool';
            title = `Executing ${toolName}`;
            typeLabel = "Tool";
            break;
        case 'validation':
            icon = <ValidationIcon />;
            typeLabel = "Quality Control";
            break;
        case 'correction':
            icon = <CorrectionIcon />;
            typeLabel = "Correction";
            break;
        case 'thought':
            icon = <ThoughtIcon />;
            typeLabel = "Thinking";
            break;
        case 'observation':
            icon = <ObservationIcon />;
            typeLabel = "Observation";
            break;
        default:
            icon = <TodoListIcon />;
            break;
    }

    return { icon, title, typeLabel };
};

// Component for streaming or static text details
const DetailsRenderer: React.FC<{ node: WorkflowNodeData }> = ({ node }) => {
    const detailsText = node.details as string;
    const isStreaming = node.status === 'active';
    const [animationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        setAnimationComplete(false);
    }, [detailsText]);

    const showFinalContent = !isStreaming || animationComplete;

    return (
        <div className="text-sm text-slate-600 dark:text-slate-300 workflow-markdown leading-relaxed">
            {isStreaming && !showFinalContent && (
                <FlowToken tps={15} onComplete={() => setAnimationComplete(true)}>
                    {detailsText}
                </FlowToken>
            )}
            {showFinalContent && (
                <ManualCodeRenderer text={detailsText} components={WorkflowMarkdownComponents} isStreaming={false} />
            )}
        </div>
    );
};

// Specialized Component for Handoffs
const HandoffNode: React.FC<{ from: string; to: string; details?: string; isStreaming: boolean }> = ({ from, to, details, isStreaming }) => {
    const fromColor = getAgentColor(from);
    const toColor = getAgentColor(to);
    
    return (
        <div className="flex flex-col gap-2 py-2">
            <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${fromColor.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>
                </div>
                <svg className="w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${toColor.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>
                </div>
            </div>
            {details && (
                <div className="pl-1 text-xs text-slate-500 dark:text-slate-400 italic">
                    {details}
                </div>
            )}
        </div>
    );
};

const WorkflowNodeRaw = ({ node, sendMessage, onRegenerate, messageId, isLast }: WorkflowNodeProps) => {
    const [isExpanded, setIsExpanded] = useState(node.status === 'active' || node.status === 'failed');
    
    // Auto-expand if it becomes active
    useEffect(() => {
        if (node.status === 'active') setIsExpanded(true);
    }, [node.status]);

    if (node.type === 'act_marker') return null;

    if (node.type === 'handoff' && node.handoff) {
        return <HandoffNode from={node.handoff.from} to={node.handoff.to} details={node.details as string} isStreaming={node.status === 'active'} />;
    }

    // --- Special Case: Search Tool Card ---
    if (node.type === 'duckduckgoSearch') {
        const event = node.details as ToolCallEvent;
        const agentColorInfo = getAgentColor(node.agentName || 'Executor');
        
        // Parse search results for sources
        let sources: { uri: string; title: string; }[] | undefined = undefined;
        if (event?.result) {
            const sourcesMatch = event.result.match(/\[SOURCES_PILLS\]([\s\S]*?)\[\/SOURCES_PILLS\]/s);
            if (sourcesMatch) {
                try {
                    const regex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
                    const parsedSources: { uri: string; title: string; }[] = [];
                    let match;
                    while ((match = regex.exec(sourcesMatch[1])) !== null) {
                        parsedSources.push({ title: match[1].trim(), uri: match[2].trim() });
                    }
                    sources = parsedSources;
                } catch (e) { console.error(e); }
            }
        }

        return (
            <div className={`group border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-white dark:bg-white/5 shadow-sm border-slate-200 dark:border-white/10' : 'bg-transparent border-transparent dark:border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                {/* Header */}
                <div 
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                            <SearchIcon />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Research</span>
                                {node.agentName && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-transparent ${agentColorInfo.bg} ${agentColorInfo.text} bg-opacity-20`}>
                                        {node.agentName}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {node.title.replace(/^"/, '').replace(/"$/, '')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {node.duration && <span className="text-xs text-slate-400 font-mono">{node.duration.toFixed(1)}s</span>}
                        <Chevron expanded={isExpanded} />
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-white/5 mt-1">
                                <div className="pt-3">
                                    <SearchToolResult query={node.title} sources={sources} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- Standard Generic Card ---
    const { icon, title, typeLabel } = getNodeVisuals(node);
    const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : getAgentColor('System');
    const hasDetails = !!node.details;

    return (
        <div className={`group border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-white dark:bg-white/5 shadow-sm border-slate-200 dark:border-white/10' : 'bg-transparent border-transparent dark:border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
            {/* Header */}
            <div 
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${agentColorInfo.bg} ${agentColorInfo.text}`}>
                        {icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{typeLabel}</span>
                            {node.agentName && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-transparent ${agentColorInfo.bg} ${agentColorInfo.text} bg-opacity-20`}>
                                    {node.agentName}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">
                            {title || 'Processing...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {node.duration && (
                        <span className="text-xs text-slate-400 font-mono hidden sm:block">{node.duration.toFixed(1)}s</span>
                    )}
                    {hasDetails && <Chevron expanded={isExpanded} />}
                </div>
            </div>

            {/* Body */}
            <AnimatePresence>
                {isExpanded && hasDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0">
                            <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-3"></div>
                            {renderNodeContent(node, sendMessage, onRegenerate, messageId)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper to render the specific content based on node structure
const renderNodeContent = (
    node: WorkflowNodeData, 
    sendMessage: WorkflowNodeProps['sendMessage'],
    onRegenerate?: (messageId: string) => void,
    messageId?: string
) => {
    // If it's a Tool Call event object
    if (typeof node.details === 'object' && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} sendMessage={sendMessage} onRegenerate={onRegenerate} messageId={messageId} />;
    }

    // If it's an Error object
    if (node.status === 'failed' && typeof node.details === 'object' && 'message' in node.details) {
        const error = node.details as MessageError;
        return (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Step Failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error.message}</p>
                {onRegenerate && messageId && (
                    <button
                        onClick={() => onRegenerate(messageId)}
                        className="mt-2 text-xs font-medium text-red-700 dark:text-red-300 hover:underline flex items-center gap-1"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                       Regenerate
                    </button>
                )}
            </div>
        );
    }
    
    // Default: String content (Thoughts, Plans, Observations)
    if (typeof node.details === 'string') {
        return <DetailsRenderer node={node} />;
    }
    
    return null;
};

const Chevron = ({ expanded }: { expanded: boolean }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
);

export const WorkflowNode = memo(WorkflowNodeRaw);
