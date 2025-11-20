
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';

const motion = motionTyped as any;

type SettingsCategoryButtonProps = {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const SettingsCategoryButton: React.FC<SettingsCategoryButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="settings-active-pill"
        className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
    <span className="relative z-10 flex-shrink-0">{icon}</span>
    <span className="relative z-10">{label}</span>
  </button>
);
