
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type Variants = any;

const searchContainerVariants: Variants = {
    open: {
        height: 'auto',
        opacity: 1,
        marginBottom: '1rem',
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    collapsed: {
        height: 0,
        opacity: 0,
        marginBottom: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    }
};

type SearchInputProps = {
  isCollapsed: boolean;
  isDesktop: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ isCollapsed, isDesktop, searchQuery, setSearchQuery }, ref) => (
  <motion.div 
      className="relative overflow-hidden px-1"
      initial={false}
      variants={searchContainerVariants}
      animate={isDesktop && isCollapsed ? 'collapsed' : 'open'}
  >
      <div className="relative group">
        <input 
          ref={ref}
          type="text" 
          placeholder="Search..." 
          className="w-full pl-9 pr-14 py-2.5 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-base md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-black/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <kbd className="hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded transition-opacity">
              Ctrl K
            </kbd>
        </div>
      </div>
  </motion.div>
));
