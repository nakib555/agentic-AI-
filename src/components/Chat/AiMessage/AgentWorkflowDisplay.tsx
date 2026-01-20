
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import type { WorkflowNodeData, ToolCallEvent } from '../../../types';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

const formatTime = (ms: number) => {
    if (!ms) return '00:00';
    const date = new Date(ms);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

const TerminalLine: React.FC<{ node: WorkflowNodeData, index: number }> = ({ node, index }) => {
    const isTool = node.type === 'tool' || node.type === 'duckduckgoSearch';
    const isError = node.status === 'failed';
    const isActive = node.status === 'active';
    const isDone = node.status === 'done';

    // Type Tag
    let typeTag = '[INFO]';
    let typeColor = 'text-blue-400';
    
    if (isTool) {
        typeTag = '[EXEC]';
        typeColor = 'text-purple-400';
    } else if (node.type === 'thought') {
        typeTag = '[THNK]';
        typeColor = 'text-gray-500';
    } else if (node.type === 'observation') {
        typeTag = '[OBSV]';
        typeColor = 'text-yellow-500';
    }

    if (isError) {
        typeTag = '[FAIL]';
        typeColor = 'text-red-500';
    } else if (isActive) {
        typeTag = '[RUN ]';
        typeColor = 'text-green-400 animate-pulse';
    }

    // Content Formatting
    let content = '';
    let subContent = '';

    if (isTool) {
        const details = node.details as ToolCallEvent;
        const argsStr = JSON.stringify(details.call?.args || {});
        content = `${node.title} ${argsStr}`;
        
        if (details.result) {
            subContent = `-> ${details.result.substring(0, 300)}${details.result.length > 300 ? '...' : ''}`;
        }
    } else {
        content = node.title;
        if (typeof node.details === 'string' && node.details !== 'No details provided.') {
             // Clean up redundancy if title repeats in details
             const cleanDetails = node.details.startsWith(node.title) 
                ? node.details.substring(node.title.length).replace(/^:\s*/, '') 
                : node.details;
             subContent = cleanDetails;
        }
    }

    return (
        <div className="font-mono text-xs leading-relaxed">
            <div className="flex gap-2">
                <span className={`flex-shrink-0 ${typeColor} font-bold`}>{typeTag}</span>
                <span className="text-gray-300 break-all">{content}</span>
            </div>
            {subContent && (
                <div className="pl-[3.5rem] text-gray-500 text-[10px] break-words whitespace-pre-wrap opacity-80">
                    {subContent}
                </div>
            )}
        </div>
    );
};

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [nodes.length, nodes[nodes.length - 1]?.status]);

    const activeNode = nodes.find(n => n.status === 'active');

    return (
        <div className="w-full my-4 rounded-sm bg-[#1e1e1e] border border-gray-700 shadow-sm overflow-hidden font-mono text-xs">
             {/* Terminal Header */}
             <div className="bg-[#2d2d2d] px-3 py-1 text-gray-500 flex justify-between items-center select-none border-b border-gray-700">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
                    <span className="ml-2 font-bold text-[10px]">AGENT_LOG</span>
                 </div>
                 <span className="text-[10px] opacity-50">/bin/sh</span>
             </div>

             <div ref={scrollRef} className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar bg-[#1e1e1e] text-gray-300 space-y-2">
                {plan && (
                    <div className="mb-4 pb-2 border-b border-gray-800 border-dashed">
                        <div className="text-emerald-500 font-bold mb-1"># INITIALIZING MISSION PLAN...</div>
                        <div className="pl-2 border-l-2 border-emerald-500/20 text-emerald-200/70 whitespace-pre-wrap leading-relaxed">
                            {plan.replace(/##/g, '').trim()}
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    {nodes.map((node, i) => (
                        <TerminalLine key={node.id || i} node={node} index={i} />
                    ))}
                </div>

                {activeNode && (
                    <div className="mt-2 text-green-500 animate-pulse">
                        <span className="mr-2">$</span>
                        <span className="inline-block w-2 h-4 bg-green-500 align-middle"></span>
                    </div>
                )}
                
                {!activeNode && nodes.length > 0 && (
                    <div className="mt-2 text-gray-500">
                        <span className="mr-2">$</span>
                        <span>_</span>
                    </div>
                )}
             </div>
        </div>
    );
};
