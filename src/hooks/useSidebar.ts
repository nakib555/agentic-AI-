/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

export const useSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? Math.max(220, Math.min(480, Number(savedWidth))) : 272;
  });

  const handleSetSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };

  const handleSetSidebarWidth = useCallback((width: number) => {
    const newWidth = Math.max(220, Math.min(480, width));
    setSidebarWidth(newWidth);
    localStorage.setItem('sidebarWidth', String(newWidth));
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
  };
};