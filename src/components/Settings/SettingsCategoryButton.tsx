
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
        ? 'bg-layer-3 text-content-primary'
        : 'text-content-secondary hover:bg-layer-2 hover:text-content-primary'
    }`}
  >
    <div className="flex-shrink-0 w-5 h-5">{icon}</div>
    <span>{label}</span>
  </button>
);
