
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentBlock, ToolExecutionBlock, MediaRenderBlock, ComponentRenderBlock } from '../../../types/message';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { MarkdownComponents } from '../../Markdown/markdownComponents';
import { CodeBlock } from '../../Markdown/CodeBlock';
import { MapDisplay } from '../../AI/MapDisplay';
import { LocationPermissionRequest } from '../../AI/LocationPermissionRequest';
import { ImageDisplay } from '../../AI/ImageDisplay';
import { VideoDisplay } from '../../AI/VideoDisplay';
import { FileAttachment } from '../../AI/FileAttachment';

// --- Icons ---
const ThoughtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>; // Info
const ToolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>;
const ChevronIcon = ({ open }: { open: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>;

// --- Components ---

const ThoughtChain = ({ block }: { block: ContentBlock & { type: 'thought_chain' } }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="my-3 border-l-2 border-slate-200 dark:border-white/10 pl-3 ml-1">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider mb-1"
            >
                <ThoughtIcon />
                <span>Thought Process</span>
                <ChevronIcon open={isOpen} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="text-sm text-slate-600 dark:text-slate-400 italic font-mono pt-2 leading-relaxed whitespace-pre-wrap">
                            {block.content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ToolExecution = ({ block }: { block: ToolExecutionBlock }) => {
    const isCode = block.variant === 'code_interpreter';
    const isRunning = block.status === 'running';
    const isSuccess = block.status === 'success';

    return (
        <div className="my-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <ToolIcon />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                        {block.toolName}
                    </span>
                </div>
                
                {/* Status Badge */}
                <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                    ${isRunning 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20' 
                        : isSuccess
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }
                `}>
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>}
                    {isSuccess && <CheckIcon />}
                    {block.status}
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                {isCode ? (
                    <div className="space-y-3">
                         {block.input?.code && (
                             <CodeBlock language={block.input.language || 'python'} isStreaming={false}>
                                 {block.input.code}
                             </CodeBlock>
                         )}
                         {block.output && (
                             <div className="mt-2 text-xs font-mono bg-black/5 dark:bg-black/40 p-3 rounded-lg border border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400">
                                 <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-slate-400">
                                     <span>Output</span>
                                 </div>
                                 <div className="whitespace-pre-wrap">{typeof block.output === 'string' ? block.output : JSON.stringify(block.output, null, 2)}</div>
                             </div>
                         )}
                    </div>
                ) : (
                    <div className="space-y-3 text-xs font-mono">
                        <div>
                            <span className="text-slate-400 uppercase font-bold text-[10px]">Input</span>
                            <div className="mt-1 p-2 bg-slate-50 dark:bg-white/5 rounded border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 break-all whitespace-pre-wrap">
                                {JSON.stringify(block.input, null, 2)}
                            </div>
                        </div>
                        {block.output && (
                            <div>
                                <span className="text-slate-400 uppercase font-bold text-[10px]">Result</span>
                                <div className="mt-1 p-2 bg-slate-50 dark:bg-white/5 rounded border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 break-all whitespace-pre-wrap">
                                    {typeof block.output === 'string' ? block.output : JSON.stringify(block.output, null, 2)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const MediaRender = ({ block }: { block: MediaRenderBlock }) => {
    const { mimeType, url, altText, filename } = block.data;

    if (mimeType.startsWith('image/')) {
        return <ImageDisplay srcUrl={url} alt={altText} caption={altText} />;
    }
    if (mimeType.startsWith('video/')) {
        return <VideoDisplay srcUrl={url} prompt={altText} />;
    }
    return <FileAttachment filename={filename || 'file'} srcUrl={url} mimeType={mimeType} />;
};

const ComponentRender = ({ block, sendMessage }: { block: ComponentRenderBlock, sendMessage: any }) => {
    const { componentType, data } = block;

    if (componentType === 'MAP') {
        return <MapDisplay latitude={data.latitude} longitude={data.longitude} zoom={data.zoom} markerText={data.markerText} />;
    }
    if (componentType === 'LOCATION_PERMISSION') {
        return <LocationPermissionRequest text={data.text} sendMessage={sendMessage} />;
    }
    return <div className="p-4 border border-dashed rounded text-xs text-slate-400">Unknown Widget</div>;
};

// --- Main Renderer ---

export const BlockRenderer: React.FC<{ block: ContentBlock, sendMessage: any }> = ({ block, sendMessage }) => {
    switch (block.type) {
        case 'thought_chain':
            return <ThoughtChain block={block} />;
        case 'tool_execution':
            return <ToolExecution block={block} />;
        case 'media_render':
            return <MediaRender block={block} />;
        case 'component_render':
            return <ComponentRender block={block} sendMessage={sendMessage} />;
        case 'final_text':
            return (
                <div className="markdown-content mt-4 mb-2">
                    <ManualCodeRenderer text={block.content} components={MarkdownComponents} isStreaming={block.status === 'running'} />
                </div>
            );
        default:
            return null;
    }
};
