
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a.78.78 0 0 1 .527-.224 41.202 41.202 0 0 0 5.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
  </svg>
);

const AgentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
  </svg>
);

export const ModeToggle: React.FC<ModeToggleProps> = ({ isAgentMode, onToggle, disabled }) => {
  const modes = [
    { label: 'Chat', isAgent: false, icon: <ChatIcon /> },
    { label: 'Agent', isAgent: true, icon: <AgentIcon /> },
  ];

  return (
    <div
      className={`relative grid grid-cols-2 p-1 rounded-xl bg-gray-100/80 dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 shadow-sm transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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
              relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-colors duration-200 rounded-lg select-none
              ${isActive 
                ? 'text-indigo-600 dark:text-indigo-300' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-white dark:bg-[#2d2d2d] shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] rounded-lg border border-gray-200/50 dark:border-white/5"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {mode.icon}
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
