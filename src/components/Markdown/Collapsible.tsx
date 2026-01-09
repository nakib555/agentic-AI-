
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';

const motion = motionTyped as any;

export const Collapsible = ({ children, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract Summary and Content from children
  const childrenArray = React.Children.toArray(children);
  
  let summaryElement: React.ReactNode | null = null;
  let contentNodes: React.ReactNode[] = [];

  childrenArray.forEach(child => {
      // Check for intrinsic 'summary' element or React element with type 'summary'
      if (React.isValidElement(child) && (child.type === 'summary' || (child.props as any)?.node?.tagName === 'summary')) {
          summaryElement = child;
      } else {
          contentNodes.push(child);
      }
  });

  // Extract title from summary element
  let title: React.ReactNode = 'Details';
  if (summaryElement) {
      const props = (summaryElement as React.ReactElement).props;
      // If summary has children (text), use that. Otherwise use defaults.
      if (props && props.children) {
          title = props.children;
      }
  }

  return (
    <div className="my-4 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/5 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-white/20">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          {title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                <div className="pt-4 markdown-content">
                    {contentNodes}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
