/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { themeControlCenter, ThemeMode } from '../services/themeControlCenter';

// Re-export type for compatibility
export type Theme = ThemeMode;

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    // 1. Trigger the Control Center
    themeControlCenter.activateTheme(theme);
    
    // 2. Persist choice
    localStorage.setItem('theme', theme);

    // 3. Handle System Mode Dynamic Updates
    if (theme === 'system') {
      const mediaQuery = themeControlCenter.getMediaQuery();
      const handleChange = () => themeControlCenter.activateTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return { theme, setTheme };
};