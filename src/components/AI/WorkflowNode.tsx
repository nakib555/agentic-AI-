
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
import { SearchIcon } from './icons';
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
        <div className="text-sm text-slate-600 dark:text-slate-300 workflow-markdown leading-relaxed pt-2">
            {isStreaming && !showFinalContent && (
                <FlowToken tps={30} onComplete={() => setAnimationComplete(true)}>
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
        <div className="flex flex-col gap-2 py-1">
            <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${fromColor.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">{from}</span>
                </div>
                <svg className="w-3 h-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${toColor.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">{to}</span>
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
    // Force expand search nodes to show the "box" immediately
    const isSearch = node.type === 'duckduckgoSearch';
    const [isExpanded, setIsExpanded] = useState(isSearch || node.status === 'active' || node.status === 'failed');
    const agentColorInfo = node.agentName ? getAgentColor(node.agentName) : getAgentColor('System');
    
    // Auto-expand if active
    useEffect(() => {
        if (node.status === 'active') setIsExpanded(true);
    }, [node.status]);

    if (node.type === 'act_marker') return null;

    if (node.type === 'handoff' && node.handoff) {
        return <HandoffNode from={node.handoff.from} to={node.handoff.to} details={node.details as string} isStreaming={node.status === 'active'} />;
    }

    // --- Special Case: Search Tool ---
    if (isSearch) {
        const event = node.details as ToolCallEvent;
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

        const isSearching = node.status === 'active';

        return (
            <div className={`mb-4 rounded-xl border overflow-hidden transition-all duration-300 ${isSearching ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-500/30 shadow-sm' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div 
                    className="flex items-center gap-3 p-3 cursor-pointer select-none"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSearching ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                       {isSearching ? (
                           <>
                             <span className="absolute inset-0 rounded-lg bg-blue-400/20 animate-ping"></span>
                             <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           </>
                       ) : (
                           <SearchIcon />
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className={`text-sm font-bold ${isSearching ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                {isSearching ? 'Searching the web...' : 'Search Completed'}
                             </span>
                             {node.duration && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{node.duration.toFixed(1)}s</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5 opacity-90">
                            Query: "{node.title.replace(/^"/, '').replace(/"$/, '')}"
                        </p>
                    </div>
                    <Chevron expanded={isExpanded} />
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 pt-0">
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-3" />
                                <SearchToolResult query={node.title} sources={sources} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- Standard Generic Card ---
    const hasDetails = !!node.details;
    const isTool = node.type === 'tool';
    const toolName = isTool ? (node.details as ToolCallEvent)?.call?.name || 'Tool' : null;
    
    // Determine header text
    let headerText = node.title;
    if (isTool) headerText = `Executing ${toolName}`;
    if (node.type === 'thought') headerText = 'Reasoning';
    if (node.type === 'observation') headerText = 'Observation';

    return (
        <div className="mb-2">
            <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {node.agentName && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border border-transparent ${agentColorInfo.bg} ${agentColorInfo.text} bg-opacity-30`}>
                                {node.agentName}
                            </span>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {headerText || 'Processing...'}
                        </span>
                        {node.duration && (
                            <span className="text-[10px] text-slate-400 font-mono">{node.duration.toFixed(1)}s</span>
                        )}
                    </div>
                </div>
                {hasDetails && <Chevron expanded={isExpanded} />}
            </div>

            <AnimatePresence>
                {isExpanded && hasDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 pl-1">
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
            <div className="p-3 mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
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
    <div className={`p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 ${expanded ? 'rotate-180 bg-slate-100 dark:bg-white/5' : ''}`}>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-3.5 h-3.5"
        >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
    </div>
);

export const WorkflowNode = memo(WorkflowNodeRaw);
