/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import type { WorkflowNodeData, ToolCallEvent } from '../../../types';

type AgentWorkflowDisplayProps = {
    plan: string;
    nodes: WorkflowNodeData[];
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    onRegenerate: (messageId: string) => void;
    messageId: string;
};

const LogNode: React.FC<{ node: WorkflowNodeData }> = ({ node }) => {
    const isTool = node.type === 'tool' || node.type === 'duckduckgoSearch';
    const isError = node.status === 'failed';
    const isDone = node.status === 'done';
    const isActive = node.status === 'active';
    
    // Status Prefix
    let prefix = <span className="text-gray-600">[WAIT]</span>;
    if (isActive) prefix = <span className="text-yellow-500 animate-pulse">[BUSY]</span>;
    if (isDone) prefix = <span className="text-green-500">[DONE]</span>;
    if (isError) prefix = <span className="text-red-500">[FAIL]</span>;

    // Content
    let content = null;

    if (isTool) {
        const details = node.details as ToolCallEvent;
        // Format args nicely if possible
        let argsStr = '';
        try {
            argsStr = JSON.stringify(details.call?.args || {});
        } catch (e) {
            argsStr = '...';
        }

        content = (
            <div className="flex flex-col">
                <div className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold flex-shrink-0">exec</span>
                    <span className="text-gray-200 font-semibold">{node.title}</span>
                </div>
                {argsStr !== '{}' && (
                    <div className="text-gray-500 text-[10px] break-all pl-1 border-l-2 border-gray-800 ml-1 mt-0.5">
                        {argsStr}
                    </div>
                )}
                {details.result && (
                    <div className="mt-1 pl-2 text-gray-400/80 text-[10px] border-l-2 border-green-900/30 ml-1 truncate">
                        <span className="text-green-600 mr-1">➜</span> 
                        {details.result.length > 200 ? details.result.substring(0, 200) + '...' : details.result}
                    </div>
                )}
            </div>
        );
    } else {
        // Text Step
        let detailsText = '';
        if (typeof node.details === 'string') {
            detailsText = node.details;
        }

        content = (
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-[10px] uppercase">{node.type}</span>
                    <span className="text-gray-300 font-semibold">{node.title || 'Processing'}</span>
                </div>
                {detailsText && detailsText !== 'No details provided.' && (
                    <div className="mt-0.5 pl-2 text-gray-500 text-[10px] leading-tight border-l-2 border-gray-800 ml-1 whitespace-pre-wrap font-sans opacity-80">
                        {detailsText}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-3 font-mono text-xs py-1 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1">
            <div className="flex-shrink-0 opacity-80 w-12 text-right font-bold tracking-tighter">{prefix}</div>
            <div className="flex-1 min-w-0 overflow-hidden">{content}</div>
        </div>
    );
};

export const AgentWorkflowDisplay: React.FC<AgentWorkflowDisplayProps> = ({ plan, nodes }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new nodes appear or status changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [nodes.length, nodes[nodes.length - 1]?.status]);

    return (
        <div className="w-full my-4 rounded-md bg-[#09090b] border border-gray-800 font-mono text-xs text-gray-300 shadow-xl overflow-hidden relative group">
             {/* Terminal Header */}
             <div className="flex items-center justify-between px-3 py-2 bg-[#121212] border-b border-gray-800 select-none">
                 <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <span className="ml-2 text-gray-500 font-bold tracking-wider text-[10px]">AGENT_RUNTIME_LOG</span>
                 </div>
                 <div className="text-[9px] text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                     v2.0
                 </div>
             </div>

             <div ref={scrollRef} className="flex flex-col p-2 max-h-[350px] overflow-y-auto custom-scrollbar bg-[#0c0c0c] relative">
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/[0.02] pointer-events-none z-10 bg-[length:100%_4px]" style={{ backgroundSize: '100% 4px' }}></div>
                
                {plan && (
                    <div className="mb-4 pb-3 border-b border-gray-800 border-dashed relative z-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-500">#</span>
                            <span className="text-gray-400 font-bold uppercase">Mission Strategy</span>
                        </div>
                        <div className="pl-4 text-gray-500 whitespace-pre-wrap leading-relaxed opacity-90 border-l border-blue-900/30 ml-0.5 text-[11px] font-sans">
                            {plan.replace(/##/g, '').trim()}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-0.5 relative z-0">
                    {nodes.map((node, i) => (
                        <LogNode key={node.id || i} node={node} />
                    ))}
                </div>
                
                {nodes.some(n => n.status === 'active') && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800 border-dashed text-gray-500 animate-pulse pl-1">
                        <span className="w-2 h-4 bg-green-500/50 block"></span>
                        <span className="tracking-widest text-[10px]">PROCESSING_STREAM...</span>
                    </div>
                )}
             </div>
        </div>
    );
};