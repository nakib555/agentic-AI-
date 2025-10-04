/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, Variants } from 'framer-motion';

const searchContainerVariants: Variants = {
    open: {
        height: 'auto',
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
    },
    collapsed: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
    }
};

type SearchInputProps = {
  isCollapsed: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const SearchInput = ({ isCollapsed, searchQuery, setSearchQuery }: SearchInputProps) => (
  <motion.div 
      className="relative mb-6 overflow-hidden"
      initial={false}
      variants={searchContainerVariants}
      animate={isCollapsed ? 'collapsed' : 'open'}
  >
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
        </div>
  </motion.div>
);