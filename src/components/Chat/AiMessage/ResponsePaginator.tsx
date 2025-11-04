/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ResponsePaginatorProps = {
  count: number;
  activeIndex: number;
  onChange: (index: number) => void;
};

export const ResponsePaginator: React.FC<ResponsePaginatorProps> = ({ count, activeIndex, onChange }) => {
  if (count <= 1) {
    return null; // Don't show paginator for a single response
  }

  const handlePrev = () => {
    if (activeIndex > 0) {
      onChange(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < count - 1) {
      onChange(activeIndex + 1);
    }
  };

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
            <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous response"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L6.56 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L4.97 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
            </button>
            <span className="font-mono text-xs">
                {activeIndex + 1} / {count}
            </span>
            <button
                onClick={handleNext}
                disabled={activeIndex === count - 1}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next response"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 0 0 1.06L9.44 8l-3.22 3.22a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06L7.28 4.22a.75.75 0 0 0-1.06 0Z" clipRule="evenodd" />
                </svg>
            </button>
        </motion.div>
    </AnimatePresence>
  );
};