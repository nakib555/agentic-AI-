/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export type ColorTheme = 'default-indigo' | 'ethereal-aurora' | 'neo-brutalism' | 'kinetic-tactile';

export const THEMES: { id: ColorTheme; name: string }[] = [
  { id: 'default-indigo', name: 'Default Indigo' },
  { id: 'ethereal-aurora', name: 'Ethereal Aurora' },
  { id: 'neo-brutalism', name: 'Neo-Brutalism' },
  { id: 'kinetic-tactile', name: 'Kinetic & Tactile' },
];

export const useColorTheme = () => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    // On initial load, get the theme from localStorage or default to 'default-indigo'
    return (localStorage.getItem('colorTheme') as ColorTheme) || 'default-indigo';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Apply the current theme as a data attribute to the root element.
    root.setAttribute('data-theme', colorTheme);
    // Save the user's theme preference.
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  return { colorTheme, setColorTheme };
};
