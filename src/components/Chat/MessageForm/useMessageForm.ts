
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This is the simplified main hook for the MessageForm component.
// It composes smaller, more focused hooks for file handling and input enhancements.

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { type MessageFormHandle } from './types';
import { useFileHandling } from './useFileHandling';
import { useInputEnhancements } from './useInputEnhancements';
import type { Message } from '../../../types';
import { usePlaceholder } from '../../../hooks/usePlaceholder';

export const useMessageForm = (
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void,
  isLoading: boolean,
  ref: React.ForwardedRef<MessageFormHandle>,
  messages: Message[],
  isAgentMode: boolean
) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  const fileHandling = useFileHandling(ref);
  const enhancements = useInputEnhancements(inputValue, setInputValue, fileHandling.processedFiles.length > 0, onSubmit);
  
  const lastMessageText = useMemo(() => {
    const lastVisibleMessage = messages.filter(m => !m.isHidden).pop();
    if (!lastVisibleMessage) return '';
    if (lastVisibleMessage.role === 'model') {
        const activeResponse = lastVisibleMessage.responses?.[lastVisibleMessage.activeResponseIndex];
        return activeResponse?.text || '';
    }
    return lastVisibleMessage.text || '';
  }, [messages]);

  const placeholder = usePlaceholder(!inputValue.trim() && !isFocused, lastMessageText, isAgentMode);

  useEffect(() => {
    // Restore text draft from local storage on initial load
    const savedText = localStorage.getItem('messageDraft_text');
    if (savedText) {
      setInputValue(savedText);
    }
  }, []);

  useEffect(() => {
    // Save text draft to local storage
    if (inputValue.trim() || fileHandling.processedFiles.length > 0) {
      localStorage.setItem('messageDraft_text', inputValue);
    } else {
      localStorage.removeItem('messageDraft_text');
    }
  }, [inputValue, fileHandling.processedFiles.length]);
  
  // Handle automatic resizing of the input area
  // Using useLayoutEffect to prevent visual flicker (FOUC) when resizing
  useLayoutEffect(() => {
    const element = inputRef.current;
    if (element) {
        const MAX_HEIGHT_PX = 192;
        
        // To correctly calculate scrollHeight, the element must be allowed to shrink.
        // We set height to 'auto' to get the natural height of the content.
        element.style.height = 'auto'; 
        
        const scrollHeight = element.scrollHeight;
        const SINGLE_LINE_THRESHOLD = 32; 
        
        setIsExpanded(scrollHeight > SINGLE_LINE_THRESHOLD || fileHandling.processedFiles.length > 0);
        
        if (scrollHeight > MAX_HEIGHT_PX) {
            element.style.height = `${MAX_HEIGHT_PX}px`;
            element.style.overflowY = 'auto';
        } else {
            element.style.height = `${scrollHeight}px`;
            element.style.overflowY = 'hidden';
        }
    } else {
        setIsExpanded(fileHandling.processedFiles.length > 0);
    }
  }, [inputValue, fileHandling.processedFiles.length]);

  // Handle clicks outside the upload menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUploadMenuOpen && attachButtonRef.current && !attachButtonRef.current.contains(event.target as Node) && uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUploadMenuOpen]);

  const clearDraft = () => {
    setInputValue('');
    fileHandling.clearFiles(); // Use the method from the file handling hook
    localStorage.removeItem('messageDraft_text');
    localStorage.removeItem('messageDraft_files');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enhancements.isRecording) enhancements.stopRecording();
    
    const isProcessingFiles = fileHandling.processedFiles.some(f => f.progress < 100 && !f.error);
    if ((!inputValue.trim() && fileHandling.processedFiles.length === 0) || isLoading || enhancements.isEnhancing || isProcessingFiles) return;

    onSubmit(inputValue, fileHandling.getFilesToSend());
    clearDraft();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files?.length > 0) {
      e.preventDefault();
      fileHandling.processAndSetFiles(Array.from(e.clipboardData.files));
    }
    // Let the default behavior handle text pasting, which will strip formatting.
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but not Shift+Enter) for a classic chat experience
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
    // Also allow submitting with Ctrl/Cmd+Enter for power users
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
    }
  };

  return {
    inputValue, setInputValue,
    isExpanded, isUploadMenuOpen, setIsUploadMenuOpen,
    isFocused, setIsFocused,
    placeholder,
    inputRef, attachButtonRef, uploadMenuRef,
    handleSubmit, handlePaste, handleKeyDown,
    ...fileHandling,
    ...enhancements,
  };
};
