/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file contains the logic extracted from MessageForm.tsx.
// It uses a custom hook to manage state, side effects, and event handlers.

import { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { fileToBase64WithProgress, base64ToFile } from '../../../utils/fileUtils';
import { enhanceUserPromptStream } from '../../../services/promptImprover';
import { type MessageFormHandle, type SavedFile, type ProcessedFile, type FileWithEditKey } from './types';
import { PROACTIVE_SUGGESTIONS, isComplexText } from './utils';

export const useMessageForm = (
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void,
  isLoading: boolean,
  ref: React.ForwardedRef<MessageFormHandle>
) => {
  const [inputValue, setInputValue] = useState('');
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: setInputValue,
  });

  const processAndSetFiles = useCallback((filesToProcess: FileWithEditKey[]) => {
    const newProcessedFiles: ProcessedFile[] = filesToProcess.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      base64Data: null,
      error: null,
    }));

    setProcessedFiles(prev => [...prev, ...newProcessedFiles]);

    newProcessedFiles.forEach(pf => {
      fileToBase64WithProgress(pf.file, (progress) => {
        setProcessedFiles(prev => prev.map(f => f.id === pf.id ? { ...f, progress } : f));
      })
      .then(base64Data => {
        setProcessedFiles(prev => prev.map(f => f.id === pf.id ? { ...f, base64Data, progress: 100 } : f));
      })
      .catch(error => {
        console.error("File processing error:", error);
        setProcessedFiles(prev => prev.map(f => f.id === pf.id ? { ...f, error: error.message || 'Failed to read file' } : f));
      });
    });
  }, []);

  useImperativeHandle(ref, () => ({
    attachFiles: (incomingFiles: File[]) => {
      if (!incomingFiles || incomingFiles.length === 0) return;
      
      const newFilesToAdd: FileWithEditKey[] = [];
      const existingEditKeys = new Set(processedFiles.map(pf => pf.file._editKey).filter(Boolean));

      for (const file of incomingFiles) {
        const editableFile = file as FileWithEditKey;
        if (editableFile._editKey) {
          if (existingEditKeys.has(editableFile._editKey)) {
            alert('This image is already attached for editing.');
            continue;
          }
        }
        newFilesToAdd.push(editableFile);
      }
      
      if (newFilesToAdd.length > 0) {
        processAndSetFiles(newFilesToAdd);
      }
    }
  }));

  useEffect(() => {
    const savedText = localStorage.getItem('messageDraft_text');
    if (savedText) setInputValue(savedText);

    const savedFilesJSON = localStorage.getItem('messageDraft_files');
    if (savedFilesJSON) {
      try {
        const savedFiles: SavedFile[] = JSON.parse(savedFilesJSON);
        if (Array.isArray(savedFiles)) {
          const restoredFiles: ProcessedFile[] = savedFiles.map(sf => {
            const file = base64ToFile(sf.data, sf.name, sf.mimeType);
            return {
              id: `${file.name}-${file.size}-${Date.now()}`,
              file, progress: 100, base64Data: sf.data, error: null,
            };
          });
          setProcessedFiles(restoredFiles);
        }
      } catch (error) {
        console.error("Failed to parse or restore saved files:", error);
        localStorage.removeItem('messageDraft_files');
      }
    }
  }, []);

  useEffect(() => {
    if (inputValue.trim() || processedFiles.length > 0) {
      localStorage.setItem('messageDraft_text', inputValue);
      const filesToSave: SavedFile[] = processedFiles.filter(pf => pf.base64Data).map(pf => ({ name: pf.file.name, mimeType: pf.file.type, data: pf.base64Data! }));
      if (filesToSave.length > 0) {
        try {
          localStorage.setItem('messageDraft_files', JSON.stringify(filesToSave));
        } catch (error) {
           if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            alert('Draft files are too large for localStorage and were not saved. Your text has been saved.');
          } else {
            console.error("Error saving files for draft:", error);
          }
        }
      } else {
        localStorage.removeItem('messageDraft_files');
      }
    } else {
      localStorage.removeItem('messageDraft_text');
      localStorage.removeItem('messageDraft_files');
    }
  }, [inputValue, processedFiles]);

  useEffect(() => {
    if (processedFiles.length === 0 && isComplexText(inputValue)) {
      setProactiveSuggestions(PROACTIVE_SUGGESTIONS);
    } else {
      setProactiveSuggestions([]);
    }
  }, [inputValue, processedFiles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUploadMenuOpen && attachButtonRef.current && !attachButtonRef.current.contains(event.target as Node) && uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUploadMenuOpen]);

  useEffect(() => {
    const element = inputRef.current;
    if (element) {
        if (element.innerText !== inputValue) element.innerText = inputValue;
        const MAX_HEIGHT_PX = 192;
        element.style.height = 'auto';
        const scrollHeight = element.scrollHeight;
        const SINGLE_LINE_THRESHOLD = 32; 
        setIsExpanded(scrollHeight > SINGLE_LINE_THRESHOLD || processedFiles.length > 0);
        if (scrollHeight > MAX_HEIGHT_PX) {
            element.style.height = `${MAX_HEIGHT_PX}px`;
            element.style.overflowY = 'auto';
        } else {
            element.style.height = `${scrollHeight}px`;
            element.style.overflowY = 'hidden';
        }
    } else {
        setIsExpanded(processedFiles.length > 0);
    }
  }, [inputValue, processedFiles.length]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) processAndSetFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setProcessedFiles(prev => prev.filter((pf) => pf.id !== id));
  };
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isRecording) stopRecording();
    const isProcessingFiles = processedFiles.some(f => f.progress < 100 && !f.error);
    if ((!inputValue.trim() && processedFiles.length === 0) || isLoading || isEnhancing || isProcessingFiles) return;

    const filesToSend: File[] = processedFiles.filter(f => f.base64Data && !f.error).map(f => base64ToFile(f.base64Data!, f.file.name, f.file.type));

    onSubmit(inputValue, filesToSend, { isThinkingModeEnabled });
    setInputValue('');
    setProcessedFiles([]);
    localStorage.removeItem('messageDraft_text');
    localStorage.removeItem('messageDraft_files');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.clipboardData.files?.length > 0) {
      processAndSetFiles(Array.from(e.clipboardData.files));
      return;
    }
    const text = e.clipboardData.getData('text/plain');
    if (text) document.execCommand('insertText', false, text);
  };

  const handleEnhancePrompt = async () => {
    const originalPrompt = inputValue;
    if (!originalPrompt.trim() || isEnhancing || isLoading) return;
    setIsEnhancing(true);
    let enhancedText = '';
    try {
        const stream = enhanceUserPromptStream(originalPrompt);
        setInputValue(''); 
        for await (const chunk of stream) {
            enhancedText += chunk;
            setInputValue(enhancedText);
        }
        if (!enhancedText.trim()) setInputValue(originalPrompt);
    } catch (e) {
        console.error("Error during prompt enhancement:", e);
        setInputValue(originalPrompt);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const formattedMessage = `${suggestion}:\n\`\`\`\n${inputValue}\n\`\`\``;
    onSubmit(formattedMessage, [], { isThinkingModeEnabled: true });
    setInputValue('');
    setProcessedFiles([]);
    localStorage.removeItem('messageDraft_text');
    localStorage.removeItem('messageDraft_files');
  };

  const handleMicClick = () => {
    if (isLoading) return;
    isRecording ? stopRecording() : (setInputValue(''), startRecording());
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    inputValue, setInputValue, processedFiles, isEnhancing, isThinkingModeEnabled,
    setIsThinkingModeEnabled, proactiveSuggestions, isUploadMenuOpen, setIsUploadMenuOpen,
    inputRef, fileInputRef, folderInputRef, attachButtonRef, uploadMenuRef, isExpanded,
    isRecording, stopRecording, startRecording, isSupported, processAndSetFiles,
    handleFileChange, handleRemoveFile, handleSubmit, handlePaste, handleEnhancePrompt,
    handleSuggestionClick, handleMicClick, handleKeyDown
  };
};
