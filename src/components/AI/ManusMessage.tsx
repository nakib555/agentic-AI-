
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowNodeData, RenderSegment } from '../../types';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { ImageDisplay } from './ImageDisplay';
import { VideoDisplay } from './VideoDisplay';
import { MapDisplay } from './MapDisplay';
import { McqComponent } from './McqComponent';
import { FileAttachment } from './FileAttachment';
import { BrowserSessionDisplay } from './BrowserSessionDisplay';
import { ErrorDisplay } from '../UI/ErrorDisplay';

type ManusMessageProps = {
    userQuery: string;
    plan: string;
    executionLog: WorkflowNodeData[];
    finalAnswerSegments: RenderSegment[];
    status: 'idle' | 'thinking' | 'completed' | 'failed';
    isStreaming: boolean;
};

// --- Parsers & Helpers ---

const parsePlanDetails = (plan: string) => {
    // Extract Mission Objective
    const objectiveMatch = plan.match(/## (?:Mission Objective|Goal|Objective)([\s\S]*?)(?=##|$)/i);
    const objective = objectiveMatch ? objectiveMatch[1].trim() : "Initializing mission parameters...";

    // Extract Roadmap
    const roadmapMatch = plan.match(/## (?:Execution Roadmap|Step-by-Step Plan)([\s\S]*?)(?=$)/i);
    const roadmapRaw = roadmapMatch ? roadmapMatch[1].trim() : "";
    const steps = roadmapRaw
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/\*\*.*?\*\*:/, '').trim());

    return { objective, steps };
};

const ConsoleLine: React.FC<{ node: WorkflowNodeData }> = ({ node }) => {
    const isTool = node.type === 'tool' || node.type === 'duckduckgoSearch';
    const isDone = node.status === 'done';
    const isFailed = node.status === 'failed';
    const isActive = node.status === 'active';

    return (
        <div className={`font-mono text-xs py-1 flex items-start gap-2 ${isFailed ? 'text-red-400' : isDone ? 'text-slate-500' : 'text-cyan-400'}`}>
            <span className="shrink-0 opacity-50">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}</span>
            <span className="shrink-0">{isActive ? '►' : isDone ? '✓' : '✖'}</span>
            <div className="break-all">
                <span className="font-bold opacity-80 uppercase text-[10px] mr-2 tracking-wider border border-white/10 px-1 rounded">
                    {node.agentName || 'SYSTEM'}
                </span>
                {isTool && <span className="text-purple-400 mr-2">call({node.title})</span>}
                {!isTool && <span>{node.title || 'Processing...'}</span>}
                
                {isDone && node.duration && (
                    <span className="ml-2 text-[10px] opacity-40">[{node.duration.toFixed(2)}s]</span>
                )}
            </div>
        </div>
    );
};

export const ManusMessage: React.FC<ManusMessageProps> = ({ 
    userQuery, 
    plan, 
    executionLog, 
    finalAnswerSegments,
    status,
    isStreaming
}) => {
    const { objective, steps } = useMemo(() => parsePlanDetails(plan), [plan]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');

    // Filter useful logs
    const visibleLogs = useMemo(() => executionLog.filter(n => n.type !== 'plan' && n.title), [executionLog]);

    // Auto-scroll console
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleLogs.length, status]);

    // Determine overall phase
    const currentPhase = status === 'thinking' 
        ? (executionLog.length > 0 ? "EXECUTING" : "PLANNING") 
        : status === 'completed' ? "SUCCESS" : "FAILED";

    const statusColor = status === 'thinking' ? 'text-cyan-400' : status === 'completed' ? 'text-green-400' : 'text-red-400';
    const borderColor = status === 'thinking' ? 'border-cyan-500/30' : status === 'completed' ? 'border-green-500/30' : 'border-red-500/30';

    return (
        <div className={`w-full my-6 rounded-xl overflow-hidden bg-[#09090b] border ${borderColor} shadow-2xl font-sans relative group transition-colors duration-500`}>
            
            {/* --- Top Bar: Mission Control Header --- */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status === 'thinking' ? 'bg-cyan-500 animate-pulse' : status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-xs font-bold tracking-[0.2em] ${statusColor}`}>
                        {currentPhase}
                    </span>
                </div>
                <div className="flex gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                    <span>PID: {Math.floor(Math.random() * 9000) + 1000}</span>
                    <span>MEM: {(visibleLogs.length * 0.4).toFixed(1)}MB</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row h-[320px] md:h-[400px]">
                
                {/* --- Left Pane: Strategy & Objectives --- */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 bg-[#0e0e0e] p-5 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Mission Plan
                    </h3>
                    
                    <div className="mb-4">
                        <div className="text-[11px] text-slate-500 font-mono mb-1">OBJECTIVE</div>
                        <p className="text-sm text-slate-200 leading-snug line-clamp-3">{objective}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {steps.length > 0 ? steps.map((step, i) => {
                            // Rough heuristic to mark steps as done based on log length vs total steps
                            const isDone = i < Math.floor((visibleLogs.length / (steps.length * 2)) * steps.length) || status === 'completed';
                            return (
                                <div key={i} className={`flex gap-3 text-xs p-2 rounded border ${isDone ? 'bg-green-500/5 border-green-500/20 text-slate-400' : 'bg-white/5 border-transparent text-slate-200'}`}>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${isDone ? 'border-green-500 text-green-500' : 'border-slate-600 text-slate-600'}`}>
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <span className={isDone ? 'line-through opacity-50' : ''}>{step}</span>
                                </div>
                            )
                        }) : (
                            <div className="text-xs text-slate-600 italic">Formulating strategy...</div>
                        )}
                    </div>
                </div>

                {/* --- Right Pane: The Terminal / Output --- */}
                <div className="flex-1 flex flex-col bg-[#050505] relative">
                    {/* Tabs */}
                    <div className="flex items-center border-b border-white/5 px-2">
                        <button 
                            onClick={() => setActiveTab('console')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'console' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                        >
                            Terminal_Output
                        </button>
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'preview' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                        >
                            Live_Preview
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative overflow-hidden">
                        {activeTab === 'console' ? (
                            <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar font-mono space-y-1">
                                {visibleLogs.length === 0 && (
                                    <div className="text-slate-600 text-xs animate-pulse">> Waiting for agent execution...</div>
                                )}
                                {visibleLogs.map((node) => (
                                    <ConsoleLine key={node.id} node={node} />
                                ))}
                                {status === 'thinking' && (
                                    <div className="flex items-center gap-2 text-cyan-500/50 text-xs py-1 animate-pulse">
                                        <span>></span>
                                        <span className="w-2 h-4 bg-cyan-500/50 block"></span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50">
                                {finalAnswerSegments.length > 0 ? (
                                    <div className="markdown-content text-sm text-slate-300">
                                        {finalAnswerSegments.map((segment, index) => {
                                            if (segment.type === 'component') {
                                                const { componentType, data } = segment;
                                                switch (componentType) {
                                                    case 'VIDEO': return <VideoDisplay key={index} {...data} />;
                                                    case 'ONLINE_VIDEO': return <VideoDisplay key={index} srcUrl={data.url} prompt={data.title} />;
                                                    case 'IMAGE':
                                                    case 'ONLINE_IMAGE': return <ImageDisplay key={index} {...data} />;
                                                    case 'MCQ': return <McqComponent key={index} {...data} />;
                                                    case 'MAP': return <MapDisplay key={index} {...data} />;
                                                    case 'FILE': return <FileAttachment key={index} {...data} />;
                                                    case 'BROWSER': return <BrowserSessionDisplay key={index} {...data} />;
                                                    default: return <ErrorDisplay key={index} error={{ message: `Unknown component: ${componentType}` }} />;
                                                }
                                            } else {
                                                return <ManualCodeRenderer key={index} text={segment.content!} components={WorkflowMarkdownComponents} isStreaming={isStreaming} />;
                                            }
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                                        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                                        <p className="text-xs font-mono">Generating response data...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Footer Status Line --- */}
            <div className="px-4 py-2 bg-[#09090b] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex gap-4">
                    <span>STATUS: {status.toUpperCase()}</span>
                    <span>THREADS: 1</span>
                </div>
                <div>
                    AGENT_VER: v9.0.2
                </div>
            </div>
        </div>
    );
};
