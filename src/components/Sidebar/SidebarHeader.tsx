/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type SidebarHeaderProps = {
  isCollapsed: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewChat: () => void;
};

export const SidebarHeader = ({ isCollapsed, setIsOpen, onNewChat }: SidebarHeaderProps) => (
  <div className={`flex items-center mb-6 h-10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
    <motion.div 
        className="flex items-center gap-2 overflow-hidden"
        initial={false}
        animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
        <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
        >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
            </div>
            <span className="font-semibold text-sm">New Chat</span>
        </button>
    </motion.div>
    
    {/* Close button for mobile */}
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