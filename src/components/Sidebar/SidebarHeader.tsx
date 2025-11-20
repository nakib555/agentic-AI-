
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { Logo } from '../UI/Logo'; 
const motion = motionTyped as any;

type SidebarHeaderProps = {
  isCollapsed: boolean;
  isDesktop: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const SidebarHeader = ({ isCollapsed, isDesktop, setIsOpen }: SidebarHeaderProps) => {
  const shouldCollapse = isDesktop && isCollapsed;
  
  return (
    <div className={`flex items-center mb-6 mt-4 flex-shrink-0 ${shouldCollapse ? 'justify-center' : 'justify-between px-4'}`}>
      <div className="flex items-center gap-3 select-none">
          <div className="flex-shrink-0">
             <Logo className="w-10 h-10" />
          </div>
          
          <motion.span 
              className="font-bold text-xl text-slate-800 dark:text-slate-100 font-['Space_Grotesk'] tracking-tight whitespace-nowrap overflow-hidden"
              initial={false}
              animate={{ width: shouldCollapse ? 0 : 'auto', opacity: shouldCollapse ? 0 : 1 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
              Agentic AI
          </motion.span>
      </div>
      
      <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          aria-label="Close sidebar"
          title="Close sidebar"
      >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
