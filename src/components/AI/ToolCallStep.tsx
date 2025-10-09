/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolCallEvent } from '../../types';
import { type WorkflowNodeType } from './WorkflowNode';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const renderToolResult = (result: string) => {
    // This regex looks for [IMAGE_COMPONENT]{...}[/IMAGE_COMPONENT] or [VIDEO_COMPONENT]{...}[/VIDEO_COMPONENT]
    const componentRegex = /\[(IMAGE|VIDEO)_COMPONENT\](\{.*?\})\[\/(IMAGE|VIDEO)_COMPONENT\]/s;
    const match = result.match(componentRegex);
    
    if (match) {
        try {
            const componentType = match[1];
            const jsonData = JSON.parse(match[2]);
            return (
              <div className="text-xs font-['Fira_Code',_monospace] bg-slate-100 dark:bg-slate-900/50 rounded-md p-2 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Component:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">{componentType}_COMPONENT</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Data:</p>
                  <ul className="space-y-1 pl-2">
                    {Object.entries(jsonData).map(([key, value]) => (
                      <li key={key} className="grid grid-cols-[auto,1fr] gap-x-2 items-start">
                        <span className="text-slate-500 dark:text-slate-400">{key}:</span>
                        <span className="text-slate-700 dark:text-slate-300 break-all truncate" title={String(value)}>{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
        } catch (e) {
            // Fallback to default rendering if JSON parsing fails
            console.error("Failed to parse component JSON for styled display:", e);
        }
    }

    // Default rendering for all other non-component tool results
    return <ManualCodeRenderer text={result} components={WorkflowMarkdownComponents} />;
};


export const ToolCallStep = ({ event, nodeType }: { event: ToolCallEvent, nodeType: WorkflowNodeType }) => {
    const { call, result } = event;
    const { name, args } = call;
    const argEntries = Object.entries(args);
  
    return (
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-slate-800 dark:text-slate-100">
            {nodeType === 'tool' ? 'Executing function:' : 'Function call:'} <code className="font-semibold">{name}</code>
        </p>
        {argEntries.length > 0 && (
          <div className="mt-2 text-xs font-['Fira_Code',_monospace] space-y-1.5">
            {argEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[auto,1fr] gap-x-2 items-start">
                <span className="text-slate-500 dark:text-slate-400 font-medium capitalize">{key}:</span>
                <span className="text-slate-700 dark:text-slate-300 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        <AnimatePresence>
            <motion.div 
                key={result ? 'result' : 'loading'}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-600/80"
            >
                {result ? (
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Result</p>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                            {renderToolResult(result)}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Executing</span>
                        <LoadingDots />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>
    );
};