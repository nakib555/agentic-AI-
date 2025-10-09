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

// --- Source Pill Component (for Search Results) ---
// FIX: Updated the SourcePill component to use React.FC to correctly type it as a functional component.
// This resolves a TypeScript error where the 'key' prop was being incorrectly assigned when the
// component is rendered inside a map function.
const SourcePill: React.FC<{ domain: string }> = ({ domain }) => (
    <a 
      href={`https://${domain}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-xs text-slate-300 transition-colors"
    >
      <img 
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} 
        alt=""
        className="w-3 h-3 rounded-sm"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {domain}
    </a>
);

// --- Search Step Component ---
const SearchStep = ({ event }: { event: ToolCallEvent }) => {
    const { call, result } = event;
    const query = call.args.query ?? 'No query provided';
    
    // Attempt to extract domain names from the result markdown for source pills
    const domains = React.useMemo(() => {
        if (!result) return [];
        const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,6})/g;
        const matches = [...result.matchAll(domainRegex)];
        const uniqueDomains = new Set(matches.map(m => m[1].toLowerCase()));
        return Array.from(uniqueDomains).slice(0, 4); // Limit to 4 pills
    }, [result]);

    return (
        <div className="bg-black/20 rounded-lg p-3 w-full">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" /></svg>
                <p className="text-sm text-slate-300">
                    Searched for “<span className="font-semibold text-slate-200">{query}</span>”
                </p>
            </div>
            {result && (
                <div className="mt-2 pt-2 border-t border-slate-600/50 flex items-center gap-2 flex-wrap">
                    {domains.map(domain => <SourcePill key={domain} domain={domain} />)}
                    {domains.length > 0 && (
                        <span className="text-xs text-slate-400">See All ({domains.length})</span>
                    )}
                </div>
            )}
        </div>
    );
};


// --- Generic Tool Step Component ---
const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const GenericToolStep = ({ event, nodeType }: { event: ToolCallEvent, nodeType: WorkflowNodeType }) => {
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
                            <ManualCodeRenderer text={result} components={WorkflowMarkdownComponents} />
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


// --- Main Router Component ---
export const ToolCallStep = ({ event, nodeType }: { event: ToolCallEvent, nodeType: WorkflowNodeType }) => {
    if (nodeType === 'googleSearch') {
        return <SearchStep event={event} />;
    }
    return <GenericToolStep event={event} nodeType={nodeType} />;
};
