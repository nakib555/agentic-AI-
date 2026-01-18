
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';

type ArtifactEventDetail = {
  code: string;
  language: string;
};

export const useArtifactSidebar = (onOpen?: () => void) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('');
  const [isResizing, setIsResizing] = useState(false);

  // Initialize width from local storage or default
  const [width, setWidth] = useState(() => {
    try {
      const savedWidth = localStorage.getItem('artifactSidebarWidth');
      return savedWidth ? Math.max(300, Math.min(window.innerWidth * 0.8, Number(savedWidth))) : 500;
    } catch (e) {
      return 500;
    }
  });

  const handleSetWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.max(300, Math.min(window.innerWidth * 0.8, newWidth));
    setWidth(clampedWidth);
    try {
      localStorage.setItem('artifactSidebarWidth', String(clampedWidth));
    } catch (e) { /* ignore */ }
  }, []);

  // Listen for Artifact open requests from deep within markdown or other components
  useEffect(() => {
    const handleOpenArtifact = (e: CustomEvent<ArtifactEventDetail>) => {
      setContent(e.detail.code);
      setLanguage(e.detail.language);
      setIsOpen(true);
      
      // Trigger callback if provided (e.g. to close other sidebars on mobile)
      if (onOpen) {
        onOpen();
      }
    };
    
    window.addEventListener('open-artifact', handleOpenArtifact as EventListener);
    return () => window.removeEventListener('open-artifact', handleOpenArtifact as EventListener);
  }, [onOpen]);

  const closeArtifact = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    content,
    language,
    width,
    setWidth: handleSetWidth,
    isResizing,
    setIsResizing,
    closeArtifact,
  };
};
