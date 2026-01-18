
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import type { Source } from '../types';

export const useSourcesSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<Source[]>([]);
  const [isResizing, setIsResizing] = useState(false);

  // Initialize width from local storage or default
  const [width, setWidth] = useState(() => {
    try {
      const savedWidth = localStorage.getItem('sourcesSidebarWidth');
      return savedWidth ? Math.max(320, Math.min(800, Number(savedWidth))) : 384;
    } catch (e) {
      return 384;
    }
  });

  const handleSetWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.max(320, Math.min(800, newWidth));
    setWidth(clampedWidth);
    try {
      localStorage.setItem('sourcesSidebarWidth', String(clampedWidth));
    } catch (e) { /* ignore */ }
  }, []);

  const openSources = useCallback((sources: Source[]) => {
    setContent(sources);
    setIsOpen(true);
  }, []);

  const closeSources = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen, // Exposed for direct manipulation if needed
    content,
    width,
    setWidth: handleSetWidth,
    isResizing,
    setIsResizing,
    openSources,
    closeSources,
  };
};
