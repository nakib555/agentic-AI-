/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import type { ToolCallEvent } from '../../types';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { LocationPermissionRequest } from './LocationPermissionRequest';
import { MapDisplay } from './MapDisplay';
import { ImageDisplay } from './ImageDisplay';
import { VideoDisplay } from './VideoDisplay';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { CodeExecutionResult } from './CodeExecutionResult';
import { CodeBlock } from '../Markdown/CodeBlock';

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const RESULT_TRUNCATE_LENGTH = 300; // characters

type ToolResultDisplayProps = {
    result: string;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ result, sendMessage }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check for special component tags first to render visual elements
    const imageMatch = result.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);
    if (imageMatch && imageMatch[1]) {
        try {
            const imageData = JSON.parse(imageMatch[1]);
            return <ImageDisplay {...imageData} />;
        } catch (e) {
            return <ErrorDisplay error={{ message: 'Failed to render image component.', details: `Invalid JSON: ${e}` }} />;
        }
    }

    const videoMatch = result.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
    if (videoMatch && videoMatch[1]) {
        try {
            const videoData = JSON.parse(videoMatch[1]);
            return <VideoDisplay {...videoData} />;
        } catch (e) {
            return <ErrorDisplay error={{ message: 'Failed to render video component.', details: `Invalid JSON: ${e}` }} />;
        }
    }
    
    const codeOutputMatch = result.match(/\[CODE_OUTPUT_COMPONENT\](\{.*?\})\[\/CODE_OUTPUT_COMPONENT\]/s);
    if (codeOutputMatch && codeOutputMatch[1]) {
        try {
            const codeOutputData = JSON.parse(codeOutputMatch[1]);
            return <CodeExecutionResult {...codeOutputData} />;
        } catch (e) {
            return <ErrorDisplay error={{ message: 'Failed to render code output component.', details: `Invalid JSON: ${e}` }} />;
        }
    }

    // Check for the special location permission request tag
    const permissionRequestMatch = result.match(/\[LOCATION_PERMISSION_REQUEST\](.*?)\[\/LOCATION_PERMISSION_REQUEST\]/s);

    if (permissionRequestMatch) {
        const text = permissionRequestMatch[1];
        return <LocationPermissionRequest text={text} sendMessage={sendMessage} />;
    }
    
    // Check if the result is a tool error
    const isError = result.startsWith('Tool execution failed');
    if (isError) {
        return (
             <div className="p-3 bg-red-500/10 dark:bg-red-900/20 border border-red-500/20 rounded-lg">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 font-mono text-xs whitespace-pre-wrap">{result}</p>
            </div>
        )
    }

    const isLongResult = result.length > RESULT_TRUNCATE_LENGTH;
    const displayedResult = isLongResult && !isExpanded 
        ? `${result.substring(0, RESULT_TRUNCATE_LENGTH)}...` 
        : result;

    return (
        <div className="p-3 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Result</p>
            <motion.div
                className="overflow-hidden text-sm workflow-markdown"
                animate={{ height: 'auto' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <ManualCodeRenderer text={displayedResult} components={WorkflowMarkdownComponents} isStreaming={false} />
            </motion.div>
            {isLongResult && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2"
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? 'Show Less' : 'Show More'}
                </button>
            )}
        </div>
    );
};


type ToolCallStepProps = {
    event: ToolCallEvent;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

export const ToolCallStep = ({ event, sendMessage }: ToolCallStepProps) => {
    const { call, result } = event;
    const { args } = call;

    // Special rendering for the 'displayMap' tool call to embed the map directly.
    if (call.name === 'displayMap') {
        const { latitude, longitude, zoom, markerText } = args as { latitude: number, longitude: number, zoom?: number, markerText?: string };
        return <MapDisplay latitude={latitude} longitude={longitude} zoom={zoom ?? 13} markerText={markerText} />;
    }
    
    // Special full-width rendering for code execution
    if (call.name === 'executeCode' && args.code) {
        const packages = (args.packages as string[] | undefined) || [];
        return (
            <div className="space-y-3 text-sm">
                {/* FIX: Added missing 'isStreaming' prop to CodeBlock */}
                <CodeBlock language={args.language as string || 'plaintext'} isStreaming={false}>{args.code as string}</CodeBlock>
                {packages.length > 0 && (
                     <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-gray-500 dark:text-slate-400">Dependencies:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {packages.map((pkg, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 font-mono rounded">
                                {String(pkg)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {result ? (
                    <ToolResultDisplay result={result} sendMessage={sendMessage} />
                ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Executing code...</span>
                    </div>
                )}
            </div>
        );
    }
    
    const argEntries = Object.entries(args);
  
    return (
      <div className="min-w-0 flex-1 text-sm space-y-3">
        {argEntries.length > 0 && (
          <div className="font-['Fira_Code',_monospace] space-y-2 border border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-black/20 p-3 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Parameters</p>
            {argEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[auto,1fr] gap-x-3 items-start text-xs">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{key}:</span>
                  <span className="text-gray-700 dark:text-slate-300 break-all whitespace-pre-wrap">{String(value)}</span>
                </div>
              )
            )}
          </div>
        )}
        <div className="pt-1">
            {result ? (
                <ToolResultDisplay result={result} sendMessage={sendMessage} />
            ) : (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <span>Executing</span>
                    <LoadingDots />
                </div>
            )}
        </div>
      </div>
    );
};