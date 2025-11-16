/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`relative px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full w-full`}
    aria-selected={isActive}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {isActive && (
      <motion.div
        className="absolute inset-0 bg-white/50 dark:bg-white/10 border border-white/30 shadow-inner rounded-full"
        layoutId="tab-pill"
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    )}
     <span className={`relative z-10 transition-colors ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'}`}>
        {label}
    </span>
  </motion.button>
);