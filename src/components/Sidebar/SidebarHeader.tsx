/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type SidebarHeaderProps = {
  isCollapsed: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const SidebarHeader = ({ isCollapsed, setIsOpen }: SidebarHeaderProps) => (
  <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
    <div className="flex items-center gap-2 overflow-hidden">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-600 flex-shrink-0">
        <path d="M12 4C13.1046 4 14 4.89543 14 6V7.67451C15.8457 8.21661 17.2166 9.58752 17.7587 11.4332H19.4332C20.5378 11.4332 21.4332 12.3287 21.4332 13.4332C21.4332 14.5378 20.5378 15.4332 19.4332 15.4332H17.7587C17.2166 17.2789 15.8457 18.6498 14 19.1919V20.8665C14 21.9711 13.1046 22.8665 12 22.8665C10.8954 22.8665 10 21.9711 10 20.8665V19.1919C8.15432 18.6498 6.7834 17.2789 6.24131 15.4332H4.56681C3.46224 15.4332 2.56681 14.5378 2.56681 13.4332C2.56681 12.3287 3.46224 11.4332 4.56681 11.4332H6.24131C6.7834 9.58752 8.15432 8.21661 10 7.67451V6C10 4.89543 10.8954 4 12 4ZM12 9.14155C9.88142 9.14155 8.14155 10.8814 8.14155 13C8.14155 15.1186 9.88142 16.8584 12 16.8584C14.1186 16.8584 15.8584 15.1186 15.8584 13C15.8584 10.8814 14.1186 9.14155 12 9.14155Z" fill="currentColor"/>
      </svg>
      <motion.span 
          className="text-2xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap"
          initial={false}
          animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
          Gemini
      </motion.span>
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