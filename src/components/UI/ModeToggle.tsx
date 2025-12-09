
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type ModeToggleProps = {
  isAgentMode: boolean;
  onToggle: (isAgent: boolean) => void;
  disabled: boolean;
};

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const AgentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

export const ModeToggle: React.FC<ModeToggleProps> = ({ isAgentMode, onToggle, disabled }) => {
  const modes = [
    { label: 'Chat', isAgent: false, icon: <ChatIcon /> },
    { label: 'Agent', isAgent: true, icon: <AgentIcon /> },
  ];

  return (
    <div
      className={`
        relative grid grid-cols-2 p-1 rounded-xl bg-slate-100/80 dark:bg-[#151515] border border-slate-200 dark:border-white/5 
        transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ width: 'fit-content' }}
    >
      {modes.map((mode) => {
        const isActive = isAgentMode === mode.isAgent;
        return (
          <button
            key={mode.label}
            onClick={() => !disabled && onToggle(mode.isAgent)}
            disabled={disabled}
            type="button"
            className={`
              relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold transition-colors duration-200 rounded-lg select-none
              ${isActive 
                ? 'text-indigo-600 dark:text-indigo-300' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-white dark:bg-[#2d2d2d] shadow-sm rounded-lg border border-slate-200/50 dark:border-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {mode.icon}
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
