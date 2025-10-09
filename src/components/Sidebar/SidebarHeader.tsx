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
  <div className={`flex items-center mb-6 h-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
    <div className="flex items-center gap-2 overflow-hidden">
        <button className="p-1 -ml-1" aria-label="Home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-slate-800 dark:text-slate-100">
              <path d="M12.243 2.25c-1.552 0-2.887 1.09-3.413 2.53-.083.228.065.46.303.46h.01c1.4 0 2.352.488 2.352 1.76 0 1.272-.952 1.76-2.352 1.76h-.01c-.238 0-.386.232-.303.46.526 1.44 1.861 2.53 3.413 2.53 2.29 0 4.155-1.864 4.155-4.15S14.533 2.25 12.243 2.25zm0 10c-1.552 0-2.887 1.09-3.413 2.53-.083.228.065.46.303.46h.01c1.4 0 2.352.488 2.352 1.76 0 1.272-.952 1.76-2.352 1.76h-.01c-.238 0-.386.232-.303.46.526 1.44 1.861 2.53 3.413 2.53 2.29 0 4.155-1.864 4.155-4.15S14.533 12.25 12.243 12.25z"/>
            </svg>
        </button>
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
