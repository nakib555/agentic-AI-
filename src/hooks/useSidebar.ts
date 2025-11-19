
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useViewport } from './useViewport';

export const useSidebar = () => {
  const { isDesktop, isWideDesktop } = useViewport();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // This state will hold the user's explicit choice (true for collapsed, false for expanded).
  // `null` means the user hasn't made a choice yet, so we use automatic behavior.
  const [userCollapseChoice, setUserCollapseChoice] = useState<boolean | null>(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    // If a value exists, parse it. Otherwise, it's null (auto).
    return savedState ? JSON.parse(savedState) : null;
  });

  // The final collapsed state depends on user choice or screen size
  const isSidebarCollapsed = useMemo(() => {
    if (!isDesktop) {
        return false; // Sidebar is never "collapsed" on mobile, it's open or closed.
    }
    if (userCollapseChoice !== null) {
        return userCollapseChoice; // Respect the user's manual setting.
    }
    // Automatic behavior: collapse on medium screens, expand on wide screens.
    return !isWideDesktop;
  }, [isDesktop, isWideDesktop, userCollapseChoice]);
  
  const handleSetSidebarCollapsed = (collapsed: boolean) => {
    setUserCollapseChoice(collapsed); // Record user's choice
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? Math.max(220, Math.min(480, Number(savedWidth))) : 272;
  });

  const handleSetSidebarWidth = useCallback((width: number) => {
    const newWidth = Math.max(220, Math.min(480, width));
    setSidebarWidth(newWidth);
    localStorage.setItem('sidebarWidth', String(newWidth));
  }, []);

  // State for Thinking Sidebar
  const [isThinkingResizing, setIsThinkingResizing] = useState(false);
  const [thinkingSidebarWidth, setThinkingSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('thinkingSidebarWidth');
    return savedWidth ? Math.max(320, Math.min(800, Number(savedWidth))) : 384; 
  });

  const handleSetThinkingSidebarWidth = useCallback((width: number) => {
    const newWidth = Math.max(320, Math.min(800, width));
    setThinkingSidebarWidth(newWidth);
    localStorage.setItem('thinkingSidebarWidth', String(newWidth));
  }, []);

  // --- State for Sources Sidebar ---
  const [isSourcesResizing, setIsSourcesResizing] = useState(false);
  const [sourcesSidebarWidth, setSourcesSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sourcesSidebarWidth');
    return savedWidth ? Math.max(320, Math.min(800, Number(savedWidth))) : 384; 
  });

  const handleSetSourcesSidebarWidth = useCallback((width: number) => {
    const newWidth = Math.max(320, Math.min(800, width));
    setSourcesSidebarWidth(newWidth);
    localStorage.setItem('sourcesSidebarWidth', String(newWidth));
  }, []);


  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    handleSetSidebarCollapsed,
    sidebarWidth,
    handleSetSidebarWidth,
    isResizing,
    setIsResizing,
    isThinkingResizing,
    setIsThinkingResizing,
    thinkingSidebarWidth,
    handleSetThinkingSidebarWidth,
    isSourcesResizing,
    setIsSourcesResizing,
    sourcesSidebarWidth,
    handleSetSourcesSidebarWidth,
  };
};
