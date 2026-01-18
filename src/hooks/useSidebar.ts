
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
    try {
        const savedState = localStorage.getItem('sidebarCollapsed');
        return savedState ? JSON.parse(savedState) : null;
    } catch (e) {
        return null;
    }
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
  
  const handleSetSidebarCollapsed = useCallback((collapsed: boolean) => {
    setUserCollapseChoice(collapsed); // Record user's choice
    try {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    } catch (e) { /* ignore write errors */ }
  }, []);
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
        const savedWidth = localStorage.getItem('sidebarWidth');
        return savedWidth ? Math.max(220, Math.min(480, Number(savedWidth))) : 272;
    } catch (e) {
        return 272;
    }
  });

  const handleSetSidebarWidth = useCallback((width: number) => {
    const newWidth = Math.max(220, Math.min(480, width));
    setSidebarWidth(newWidth);
    try {
        localStorage.setItem('sidebarWidth', String(newWidth));
    } catch (e) { /* ignore */ }
  }, []);

  // Helper to toggle sidebar state appropriately based on device
  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      handleSetSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  }, [isDesktop, isSidebarCollapsed, isSidebarOpen, handleSetSidebarCollapsed]);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    handleSetSidebarCollapsed,
    sidebarWidth,
    handleSetSidebarWidth,
    isResizing,
    setIsResizing,
    toggleSidebar, // New helper
  };
};
