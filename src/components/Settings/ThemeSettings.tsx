/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeCard } from '../UI/ThemeCard';
import { type ColorTheme, THEMES } from '../../hooks/useColorTheme';

type ThemeSettingsProps = {
  activeTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
};

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ activeTheme, onThemeChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-text-primary mb-6">Appearance</h3>
      {THEMES.map(theme => (
        <ThemeCard
          key={theme.id}
          themeId={theme.id}
          themeName={theme.name}
          isActive={activeTheme === theme.id}
          onClick={() => onThemeChange(theme.id)}
        />
      ))}
    </div>
  );
};
