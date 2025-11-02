/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type ThemeCardProps = {
  themeId: string;
  themeName: string;
  isActive: boolean;
  onClick: () => void;
};

export const ThemeCard: React.FC<ThemeCardProps> = ({ themeId, themeName, isActive, onClick }) => {
  // A map of theme IDs to their representative color palettes for the preview.
  const colorMap: Record<string, string[]> = {
    'default-indigo': ['#4f46e5', '#a78bfa', '#1e1b4b', '#e0e7ff'],
    'ethereal-aurora': ['#3730a3', '#c026d3', '#14b8a6', '#fefce8'],
    'neo-brutalism': ['#1a1a1a', '#fef08a', '#f5f5f5', '#454545'],
    'kinetic-tactile': ['#0ea5e9', '#dcfce7', '#1f2937', '#f3f4f6'],
  };
  const colors = colorMap[themeId] || [];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${isActive ? 'border-primary' : 'border-color hover:border-ui-300'}`}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-text-primary">{themeName}</span>
        <div className="flex -space-x-1.5">
          {colors.map((color, index) => (
            <div
              key={index}
              className="w-5 h-5 rounded-full border-2 border-white dark:border-ui-100"
              style={{ backgroundColor: color, zIndex: 4 - index }}
            />
          ))}
        </div>
      </div>
    </button>
  );
};
