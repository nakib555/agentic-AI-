/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { VeoApiKeyRequest } from './VeoApiKeyRequest';
import { BrowserSessionDisplay } from './BrowserSessionDisplay';

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
    onRegenerate: () => void;
};

const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ result, sendMessage, onRegenerate }) => {
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

    const browserMatch = result.match(/\[BROWSER_COMPONENT\](\{.*?\})\[\/BROWSER_COMPONENT\]/s);
    if (browserMatch && browserMatch[1]) {
        try {
            const browserData = JSON.parse(browserMatch[1]);
            // Render the browser UI and potentially the text content below it if it's mixed
            const restOfContent = result.replace(browserMatch[0], '').trim();
            return (
                <div className="w-full">
                    <BrowserSessionDisplay {...browserData} />
                    {restOfContent && (
                         <motion.div
                            className="overflow-hidden text-sm workflow-markdown mt-4 p-3 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                            animate={{ height: 'auto' }}
                        >
                            <ManualCodeRenderer text={restOfContent.length > RESULT_TRUNCATE_LENGTH && !isExpanded ? `${restOfContent.substring(0, RESULT_TRUNCATE_LENGTH)}...` : restOfContent} components={WorkflowMarkdownComponents} isStreaming={false} />
                             {restOfContent.length > RESULT_TRUNCATE_LENGTH && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2"
                                    aria-expanded={isExpanded}
                                >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            );
        } catch (e) {
            return <ErrorDisplay error={{ message: 'Failed to render browser component.', details: `Invalid JSON: ${e}` }} />;
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

    // Check for Veo API key request
    const veoKeyRequestMatch = result.match(/\[VEO_API_KEY_SELECTION_COMPONENT\](.*?)\[\/VEO_API_KEY_SELECTION_COMPONENT\]/s);
    if (veoKeyRequestMatch) {
        const text = veoKeyRequestMatch[1];
        return <VeoApiKeyRequest text={text} onRegenerate={onRegenerate} />;
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
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 font-mono text-sm whitespace-pre-wrap">{result}</p>
            </div>
        )
    }

    const isLongResult = result.length > RESULT_TRUNCATE_LENGTH;
    const displayedResult = isLongResult && !isExpanded 
        ? `${result.substring(0, RESULT_TRUNCATE_LENGTH)}...` 
        : result;

    return (
        <div className="p-3 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg">
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Result</p>
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
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2"
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
    onRegenerate?: (messageId: string) => void;
    messageId?: string;
};

export const ToolCallStep = ({ event, sendMessage, onRegenerate, messageId }: ToolCallStepProps) => {
    const { call, result, browserSession } = event;
    const { args } = call;

    const handleRegenerate = () => {
        if (onRegenerate && messageId) {
            onRegenerate(messageId);
        }
    };

    // Special rendering for the 'displayMap' tool call to embed the map directly.
    if (call.name === 'displayMap') {
        const { latitude, longitude, zoom, markerText } = args as { latitude: number, longitude: number, zoom?: number, markerText?: string };
        return <MapDisplay latitude={latitude} longitude={longitude} zoom={zoom ?? 13} markerText={markerText} />;
    }
    
    // Special rendering for live browser session
    if (call.name === 'browser' && browserSession) {
        return (
            <div className="w-full">
               <BrowserSessionDisplay 
                   url={browserSession.url}
                   title={browserSession.title || 'Loading...'}
                   screenshot={browserSession.screenshot || ''}
                   logs={browserSession.logs}
               />
               {/* If completed and there is result text, show it too */}
               {result && !result.startsWith('[BROWSER_COMPONENT]') && (
                   <div className="mt-4">
                       <ToolResultDisplay result={result} sendMessage={sendMessage} onRegenerate={handleRegenerate} />
                   </div>
               )}
            </div>
        );
    }
    
    // Special full-width rendering for code execution
    if (call.name === 'executeCode' && args.code) {
        const packages = (args.packages as string[] | undefined) || [];
        return (
            <div className="space-y-3 text-sm">
                <CodeBlock language={args.language as string || 'plaintext'} isStreaming={false}>{args.code as string}</CodeBlock>
                {packages.length > 0 && (
                     <div className="flex items-center gap-2 text-sm">
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
                    <ToolResultDisplay result={result} sendMessage={sendMessage} onRegenerate={handleRegenerate} />
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
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
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Parameters</p>
            {argEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[auto,1fr] gap-x-3 items-start text-sm">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{key}:</span>
                  <span className="text-gray-700 dark:text-slate-300 break-all whitespace-pre-wrap">{String(value)}</span>
                </div>
              )
            )}
          </div>
        )}
        <div className="pt-1">
            {result ? (
                <ToolResultDisplay result={result} sendMessage={sendMessage} onRegenerate={handleRegenerate} />
            ) : call.name === 'generateVideo' ? (
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-sm">
                    <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-indigo-500 dark:text-indigo-400 animate-pulse mt-0.5"><path d="m11.25 8.122-2.122-1.59a.75.75 0 0 0-1.278.61v4.716a.75.75 0 0 0 1.278.61l2.122-1.59a.75.75 0 0 0 0-1.22Z" /><path fillRule="evenodd" d="M1.75 6.125a3.375 3.375 0 0 1 3.375-3.375h10.125a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H5.125a3.375 3.375 0 0 1-3.375-3.375V6.125Zm2.625.75c-.414 0-.75.336-.75.75v7.25c0 .414.336.75.75.75h10.125a.75.75 0 0 0 .75-.75V6.125a.75.75 0 0 0-.75-.75H4.375Z" clipRule="evenodd" /></svg>
                        <div>
                           <p className="font-semibold text-indigo-700 dark:text-indigo-300">Generating video...</p>
                           <p className="text-indigo-600/80 dark:text-indigo-400/80 mt-1">This can take a few minutes. Please wait.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                    <span>Executing</span>
                    <LoadingDots />
                </div>
            )}
        </div>
      </div>
    );
};
