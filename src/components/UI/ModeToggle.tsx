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

const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0 -16ZM6.39 6.39a.75.75 0 0 1 1.06 0l2.122 2.121.14-.14a.75.75 0 0 1 1.06 0l2.122 2.122a.75.75 0 0 1-1.06 1.06l-2.121-2.122-.14.14a.75.75 0 0 1-1.06 0L6.39 7.45a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
const AgentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734-2.106-2.106a1.533 1.533 0 0 1-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>;

export const ModeToggle: React.FC<ModeToggleProps> = ({ isAgentMode, onToggle, disabled }) => {
  const modes = [
    { label: 'Chat', isAgent: false, icon: <ChatIcon /> },
    { label: 'Agent', isAgent: true, icon: <AgentIcon /> },
  ];

  return (
    <div className={`flex items-center gap-1 p-1 rounded-full bg-gray-200/70 dark:bg-black/20 ${disabled ? 'opacity-50' : ''}`}>
      {modes.map(mode => {
        const isActive = isAgentMode === mode.isAgent;
        return (
          <button
            key={mode.label}
            onClick={() => onToggle(mode.isAgent)}
            disabled={disabled}
            className="group relative px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
            aria-pressed={isActive}
          >
            {/* The active state has a solid pill that animates */}
            {isActive && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            {/* A hidden background for the hover effect on the inactive button */}
            {!isActive && (
                <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}

            <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-gray-900 dark:text-slate-50' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-50 transition-colors duration-200'}`}>
              {mode.icon}
              {mode.label}
            </span>
          </button>
        )
      })}
    </div>
  );
};