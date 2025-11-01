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
  };
};