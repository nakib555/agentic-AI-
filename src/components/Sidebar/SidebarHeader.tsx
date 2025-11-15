/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type SidebarHeaderProps = {
  isCollapsed: boolean;
  isDesktop: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewChat: () => void;
};

export const SidebarHeader = ({ isCollapsed, isDesktop, setIsOpen, onNewChat }: SidebarHeaderProps) => {
  const shouldCollapse = isDesktop && isCollapsed;
  return (
    <div className={`flex items-center mb-6 h-10 ${shouldCollapse ? 'justify-center' : 'justify-between'}`}>
      <div className="relative group">
          <button 
              onClick={onNewChat}
              className={`w-full flex items-center gap-2 rounded-lg transition-colors text-left bg-white dark:bg-zinc-800 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 shadow-sm border border-slate-200 dark:border-zinc-700 ${shouldCollapse ? 'p-2.5 justify-center' : 'px-3 py-2'}`}
          >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
              </div>
              <motion.span 
                  className="font-semibold text-sm overflow-hidden text-slate-800 dark:text-slate-100"
                  initial={false}
                  animate={{ width: shouldCollapse ? 0 : 'auto', opacity: shouldCollapse ? 0 : 1, x: shouldCollapse ? -5 : 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                  New Chat
              </motion.span>
          </button>
          {shouldCollapse && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  New Chat
              </div>
          )}
      </div>
      
      <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label="Close sidebar"
          title="Close sidebar"
      >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};