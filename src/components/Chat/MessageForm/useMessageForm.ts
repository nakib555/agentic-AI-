/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This is the simplified main hook for the MessageForm component.
// It composes smaller, more focused hooks for file handling and input enhancements.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type MessageFormHandle } from './types';
import { useFileHandling } from './useFileHandling';
import { useInputEnhancements } from './useInputEnhancements';

export const useMessageForm = (
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void,
  isLoading: boolean,
  isAgentMode: boolean,
  ref: React.ForwardedRef<MessageFormHandle>
) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  const fileHandling = useFileHandling(ref);
  const enhancements = useInputEnhancements(inputValue, setInputValue, fileHandling.processedFiles.length > 0, onSubmit);

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
  useEffect(() => {
    const element = inputRef.current;
    if (element) {
        // Sync the contentEditable div with the state if they diverge (e.g., on voice input)
        if (element.innerText !== inputValue) {
            element.innerText = inputValue;
        }
        const MAX_HEIGHT_PX = 192;
        element.style.height = 'auto'; // Reset height to calculate natural scroll height
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

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.clipboardData.files?.length > 0) {
      fileHandling.processAndSetFiles(Array.from(e.clipboardData.files));
      return;
    }
    const text = e.clipboardData.getData('text/plain');
    if (text) document.execCommand('insertText', false, text);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = enhancements.isRecording
    ? 'Listening...'
    : isLoading
    ? 'Gemini is thinking...'
    : isAgentMode
    ? 'Describe your mission, or drop a file...'
    : 'Message Gemini, or drop a file...';

  return {
    inputValue, setInputValue,
    isExpanded, isUploadMenuOpen, setIsUploadMenuOpen,
    inputRef, attachButtonRef, uploadMenuRef,
    handleSubmit, handlePaste, handleKeyDown,
    placeholder,
    ...fileHandling,
    ...enhancements,
  };
};