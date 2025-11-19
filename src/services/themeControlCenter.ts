/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import lightTheme from '../theme/light';
import darkTheme from '../theme/dark';
import systemTheme from '../theme/system';

export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeControlCenterService {
  private currentMode: ThemeMode = 'system';
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * Activates the specified theme mode.
   * This acts as the central switchboard for the entire UI.
   */
  public activateTheme(mode: ThemeMode) {
    console.log(`[ThemeControlCenter] Activating mode: ${mode}`);
    this.currentMode = mode;

    if (mode === 'system') {
      this.handleSystemMode();
    } else {
      this.applyThemeFile(mode);
    }
  }

  /**
   * Logic for System Mode: Detects preference and redirects.
   */
  private handleSystemMode() {
    const systemConfig = systemTheme; // Reading from system.ts
    if (systemConfig.autoDetect) {
      const resolvedTheme = this.mediaQuery.matches ? 'dark' : 'light';
      console.log(`[ThemeControlCenter] System mode detected: ${resolvedTheme}`);
      this.applyThemeFile(resolvedTheme);
    }
  }

  /**
   * Loads the specific theme file and injects values into the DOM.
   */
  private applyThemeFile(theme: 'light' | 'dark') {
    const themeTokens = theme === 'dark' ? darkTheme : lightTheme;
    const root = document.documentElement;

    // 1. Inject CSS Variables (The Colors)
    Object.entries(themeTokens).forEach(([key, value]) => {
      root.style.setProperty(key, String(value));
    });

    // 2. Toggle Tailwind Class (The Utilities)
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }

  /**
   * Returns the media query list for external listeners.
   */
  public getMediaQuery() {
    return this.mediaQuery;
  }
}

export const themeControlCenter = new ThemeControlCenterService();