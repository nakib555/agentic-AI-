/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { ToolCallEvent } from '../../types';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { type WorkflowNodeType } from './WorkflowNode';

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

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
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={WorkflowMarkdownComponents}
                            >
                                {result}
                            </ReactMarkdown>
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