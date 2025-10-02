/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    // Default to 'text' if no language is specified.
    const language = match ? match[1] : 'text';
  
    const handleCopy = () => {
      const code = String(children).replace(/\n$/, '');
      navigator.clipboard.writeText(code).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy code: ', err);
      });
    };
  
    if (inline) {
      return <code className="bg-slate-200 dark:bg-slate-700 rounded px-1 py-0.5 font-['Fira_Code',_monospace] font-medium text-sm text-slate-900 dark:text-slate-200" {...props}>{children}</code>;
    }
  
    return (
      <div className="my-4 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[rgba(255,255,255,0.08)] text-sm overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-200/50 dark:bg-[#171717]">
          <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-medium capitalize">{language}</span>
          <button
            onClick={handleCopy}
            aria-label={isCopied ? 'Copied' : 'Copy code'}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCopied ? (
                <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
        <pre className="p-4 overflow-x-auto bg-transparent dark:bg-[#151719] !m-0 !p-4 whitespace-pre" {...props}>
            <code className={`font-['Fira_Code',_monospace] ${className}`}>
                {children}
            </code>
        </pre>
      </div>
    );
  };