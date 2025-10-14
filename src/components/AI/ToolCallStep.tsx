/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ToolCallEvent } from '../../types';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { LocationPermissionRequest } from './LocationPermissionRequest';

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const RESULT_TRUNCATE_LENGTH = 300; // characters

type ToolResultDisplayProps = {
    result: string;
    sendMessage: (message: string, files?: File[], options?: { isHidden: boolean }) => void;
};

const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ result, sendMessage }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check for the special location permission request tag
    const permissionRequestMatch = result.match(/\[LOCATION_PERMISSION_REQUEST\](.*?)\[\/LOCATION_PERMISSION_REQUEST\]/s);

    if (permissionRequestMatch) {
        const text = permissionRequestMatch[1];
        return <LocationPermissionRequest text={text} sendMessage={sendMessage} />;
    }

    const isLongResult = result.length > RESULT_TRUNCATE_LENGTH;
    const displayedResult = isLongResult && !isExpanded 
        ? `${result.substring(0, RESULT_TRUNCATE_LENGTH)}...` 
        : result;

    return (
        <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Result</p>
            <motion.div
                className="overflow-hidden"
                animate={{ height: 'auto' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <ManualCodeRenderer text={displayedResult} components={WorkflowMarkdownComponents} />
            </motion.div>
            {isLongResult && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-400 dark:text-teal-400 dark:hover:text-teal-300 mt-2"
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
    sendMessage: (message: string, files?: File[], options?: { isHidden: boolean }) => void;
};

export const ToolCallStep = ({ event, sendMessage }: ToolCallStepProps) => {
    const { call, result } = event;
    const { args } = call;
    const argEntries = Object.entries(args);
  
    return (
      <div className="min-w-0 flex-1 text-sm space-y-3">
        {argEntries.length > 0 && (
          <div className="text-xs font-['Fira_Code',_monospace] space-y-1.5 bg-slate-800/70 p-2 rounded-md">
            <p className="text-xs font-semibold text-slate-400 mb-1">Parameters</p>
            {argEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[auto,1fr] gap-x-2 items-start">
                <span className="text-slate-500 font-medium capitalize">{key}:</span>
                <span className="text-slate-300 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2">
            {result ? (
                <ToolResultDisplay result={result} sendMessage={sendMessage} />
            ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Executing</span>
                    <LoadingDots />
                </div>
            )}
        </div>
      </div>
    );
};