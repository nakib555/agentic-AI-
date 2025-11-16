/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type SettingsCategoryButtonProps = {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const SettingsCategoryButton: React.FC<SettingsCategoryButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
      isActive
        ? 'bg-gray-200/60 dark:bg-black/40 text-gray-900 dark:text-slate-50'
        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-black/20'
    }`}
  >
    <div className="flex-shrink-0 w-5 h-5">{icon}</div>
    <span>{label}</span>
  </button>
);
