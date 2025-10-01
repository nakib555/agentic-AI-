/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const lightHljs = document.getElementById('hljs-light') as HTMLLinkElement;
    const darkHljs = document.getElementById('hljs-dark') as HTMLLinkElement;

    const applyTheme = (themeToApply: 'light' | 'dark') => {
        if (themeToApply === 'dark') {
            root.classList.add('dark');
            if (lightHljs) lightHljs.disabled = true;
            if (darkHljs) darkHljs.disabled = false;
        } else {
            root.classList.remove('dark');
            if (lightHljs) lightHljs.disabled = false;
            if (darkHljs) darkHljs.disabled = true;
        }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (theme === 'system') {
        localStorage.removeItem('theme');
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    }
    
    const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
};
