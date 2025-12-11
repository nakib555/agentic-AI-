
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
  isAgentMode: boolean,
  hasApiKey: boolean
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

  const placeholder = usePlaceholder(!inputValue.trim() && !isFocused, lastMessageText, isAgentMode, hasApiKey);

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
  // Uses a shadow element to calculate height, allowing for smooth CSS transitions on the real element
  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element) return;

    // Create a hidden shadow element to calculate exact height requirements
    // This allows us to update the real element's height without the
    // jitter caused by resetting to 'auto' directly on the visible element.
    const shadow = document.createElement('textarea');
    const computed = window.getComputedStyle(element);

    // Copy critical styles that affect layout/sizing
    shadow.value = inputValue;
    shadow.style.width = computed.width;
    shadow.style.padding = computed.padding;
    shadow.style.border = computed.border;
    shadow.style.fontSize = computed.fontSize;
    shadow.style.fontFamily = computed.fontFamily;
    shadow.style.fontWeight = computed.fontWeight;
    shadow.style.lineHeight = computed.lineHeight;
    shadow.style.letterSpacing = computed.letterSpacing;
    shadow.style.boxSizing = computed.boxSizing;
    
    // Hide shadow
    shadow.style.position = 'absolute';
    shadow.style.visibility = 'hidden';
    shadow.style.top = '-9999px';
    shadow.style.left = '-9999px';
    shadow.style.overflow = 'hidden';
    shadow.style.height = '0';
    shadow.style.minHeight = '0'; // Ensure it can shrink to content

    document.body.appendChild(shadow);
    
    // Force calculation
    const scrollHeight = shadow.scrollHeight;
    
    // Cleanup
    document.body.removeChild(shadow);

    const MAX_HEIGHT_PX = 192;
    const SINGLE_LINE_THRESHOLD = 32; 
    
    setIsExpanded(scrollHeight > SINGLE_LINE_THRESHOLD || fileHandling.processedFiles.length > 0);
    
    if (scrollHeight > MAX_HEIGHT_PX) {
        element.style.height = `${MAX_HEIGHT_PX}px`;
        element.style.overflowY = 'auto';
    } else {
        element.style.height = `${scrollHeight}px`;
        element.style.overflowY = 'hidden';
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
    console.log('[DEBUG] useMessageForm: handleSubmit called');

    if (enhancements.isRecording) {
        console.log('[DEBUG] useMessageForm: Stopping recording before submit');
        enhancements.stopRecording();
    }
    
    const isProcessingFiles = fileHandling.processedFiles.some(f => f.progress < 100 && !f.error);
    
    console.log('[DEBUG] useMessageForm State:', {
        inputValueLength: inputValue.trim().length,
        hasFiles: fileHandling.processedFiles.length > 0,
        isLoading,
        isEnhancing: enhancements.isEnhancing,
        isProcessingFiles
    });

    if ((!inputValue.trim() && fileHandling.processedFiles.length === 0) || isLoading || enhancements.isEnhancing || isProcessingFiles) {
        console.warn('[DEBUG] useMessageForm: Submission blocked due to validation state.');
        return;
    }

    console.log('[DEBUG] useMessageForm: Calling onSubmit prop');
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
