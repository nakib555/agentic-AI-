/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
    const objective = objectiveMatch ? objectiveMatch[1].trim() : "Processing request...";

    // Infer Intent/Domain from objective
    let intent = "General Task";
    if (objective.match(/search|find|research/i)) intent = "Research & Retrieval";
    if (objective.match(/code|script|function|program/i)) intent = "Engineering & Development";
    if (objective.match(/image|video|draw|paint/i)) intent = "Creative Generation";
    if (objective.match(/analyze|examine|study/i)) intent = "Data Analysis";

    let domain = "General Knowledge";
    if (objective.match(/stock|market|finance/i)) domain = "Finance & Economics";
    if (objective.match(/medical|health|doctor/i)) domain = "Healthcare & Science";
    if (objective.match(/map|location|where/i)) domain = "Geography & Navigation";
    if (objective.match(/python|javascript|react/i)) domain = "Software Engineering";

    // Extract Roadmap
    const roadmapMatch = plan.match(/## (?:Execution Roadmap|Step-by-Step Plan)([\s\S]*?)(?=$)/i);
    const roadmapRaw = roadmapMatch ? roadmapMatch[1].trim() : "";
    const steps = roadmapRaw
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/\*\*.*?\*\*:/, '').trim());

    return { objective, intent, domain, steps };
};

const SectionHeader = ({ title, icon }: { title: string, icon?: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 bg-[#252525]/50">
        <span className="text-gray-500 font-mono text-xs">{icon}</span>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">{title}</h3>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'done' || status === 'completed') return <span className="text-green-400 font-mono text-xs">✔ Success</span>;
    if (status === 'failed') return <span className="text-red-400 font-mono text-xs">✖ Failed</span>;
    if (status === 'active') return <span className="text-indigo-400 font-mono text-xs animate-pulse">● Processing</span>;
    return <span className="text-gray-500 font-mono text-xs">○ Pending</span>;
};

export const ManusMessage: React.FC<ManusMessageProps> = ({ 
    userQuery, 
    plan, 
    executionLog, 
    finalAnswerSegments,
    status,
    isStreaming
}) => {
    const { objective, intent, domain, steps } = useMemo(() => parsePlanDetails(plan), [plan]);

    // Filter meaningful execution steps (ignore pure text markers if they clutter)
    const pipelineSteps = executionLog.filter(node => node.type !== 'act_marker');

    return (
        <div className="w-full max-w-4xl mx-auto my-4 font-sans text-sm rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-2xl">
            
            {/* Header */}
            <div className="bg-[#2d2d2d] border-b border-gray-700 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    <span className="ml-2 font-mono text-xs font-bold text-gray-300 tracking-wider">🧠 MANUS AI MESSAGE</span>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'thinking' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                    <span className="font-mono text-[10px] text-gray-500 uppercase">{status === 'thinking' ? 'ACTIVE' : 'IDLE'}</span>
                </div>
            </div>

            {/* 1. User Input (Context) */}
            <div className="border-b border-gray-700 border-dashed">
                <SectionHeader title="USER INPUT" icon="👤" />
                <div className="p-4 bg-[#1e1e1e]">
                    <p className="font-mono text-gray-300 leading-relaxed">"{userQuery}"</p>
                </div>
            </div>

            {/* 2. Agent Interpretation */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-700 border-dashed">
                <div className="border-r border-gray-700 border-dashed md:border-r">
                    <SectionHeader title="AGENT INTERPRETATION" icon="🧩" />
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-mono text-xs">Intent</span>
                            <span className="text-indigo-400 font-mono text-xs font-semibold">{intent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-mono text-xs">Domain</span>
                            <span className="text-emerald-400 font-mono text-xs font-semibold">{domain}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-mono text-xs">Output</span>
                            <span className="text-amber-400 font-mono text-xs font-semibold">
                                {finalAnswerSegments.length > 0 ? "Composite Response" : "Processing..."}
                            </span>
                        </div>
                    </div>
                </div>
                <div>
                    <SectionHeader title="MISSION PLAN" icon="🎯" />
                    <div className="p-4">
                        {steps.length > 0 ? (
                            <ul className="space-y-1.5">
                                {steps.slice(0, 4).map((step, i) => (
                                    <li key={i} className="flex gap-2 text-gray-400 font-mono text-xs truncate">
                                        <span className="text-gray-600">{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                                {steps.length > 4 && <li className="text-gray-600 font-mono text-xs italic pl-4">...and {steps.length - 4} more</li>}
                            </ul>
                        ) : (
                            <p className="text-gray-600 font-mono text-xs italic">Formulating strategy...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Execution Pipeline */}
            <div className="border-b border-gray-700 border-dashed">
                <SectionHeader title="EXECUTION PIPELINE" icon="⚙️" />
                <div className="p-4 bg-[#1a1a1a]">
                    {pipelineSteps.length === 0 ? (
                        <div className="text-gray-600 font-mono text-xs text-center py-2">Waiting for execution...</div>
                    ) : (
                        <div className="space-y-2">
                            {pipelineSteps.map((node) => (
                                <div key={node.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-indigo-500 animate-pulse' : node.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-gray-300 font-mono text-xs font-bold truncate">{node.title}</span>
                                            {node.agentName && <span className="text-gray-600 font-mono text-[10px] uppercase">{node.agentName}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="text-gray-600 font-mono text-[10px] hidden sm:block">
                                            {node.type === 'tool' ? 'Tool Call' : 'Internal'}
                                        </span>
                                        <StatusBadge status={node.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Final Response */}
            <div>
                <SectionHeader title="FINAL RESPONSE" icon="💬" />
                <div className="p-6 bg-[#1e1e1e] text-gray-200">
                    {finalAnswerSegments.length === 0 && status === 'thinking' ? (
                        <div className="flex items-center gap-2 text-gray-500 font-mono text-sm">
                            <span className="animate-pulse">_</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                    return (
                                        <ManualCodeRenderer 
                                            key={index} 
                                            text={segment.content!} 
                                            components={WorkflowMarkdownComponents} 
                                            isStreaming={isStreaming && index === finalAnswerSegments.length - 1} 
                                        />
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#2d2d2d] p-2 border-t border-gray-700 flex justify-end">
                <span className="text-[10px] font-mono text-gray-500">SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
        </div>
    );
};