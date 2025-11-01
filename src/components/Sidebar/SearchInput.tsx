/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

// FIX: Define Variants as any to bypass type resolution issue.
type Variants = any;

const searchContainerVariants: Variants = {
    open: {
        height: 'auto',
        opacity: 1,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    collapsed: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    }
};

type SearchInputProps = {
  isCollapsed: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ isCollapsed, searchQuery, setSearchQuery }, ref) => (
  <motion.div 
      className="relative overflow-hidden"
      initial={false}
      variants={searchContainerVariants}
      animate={isCollapsed ? 'collapsed' : 'open'}
  >
      <div className="relative">
        <input 
          ref={ref}
          type="text" 
          placeholder="Search" 
          className="w-full pl-10 pr-16 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <kbd className="inline-flex items-center px-2 py-0.5 text-xs font-sans text-slate-500 bg-white/50 dark:bg-black/20 border border-slate-300/70 dark:border-white/10 rounded">
              Ctrl+K
            </kbd>
        </div>
      </div>
  </motion.div>
));