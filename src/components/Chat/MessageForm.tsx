/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { fileToBase64, base64ToFile } from '../../utils/fileUtils';
import { AttachedFilePreview } from './AttachedFilePreview';
import { enhanceUserPromptStream } from '../../services/promptImprover';

type MessageFormProps = {
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void;
  isLoading: boolean;
  onCancel: () => void;
};

type SavedFile = {
  name: string;
  mimeType: string;
  data: string; // base64
};

export const MessageForm = ({ onSubmit, isLoading, onCancel }: MessageFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: setInputValue,
  });

  // Restore draft on component mount
  useEffect(() => {
    const savedText = localStorage.getItem('messageDraft_text');
    if (savedText) {
      setInputValue(savedText);
    }

    const savedFilesJSON = localStorage.getItem('messageDraft_files');
    if (savedFilesJSON) {
      try {
        const savedFiles: SavedFile[] = JSON.parse(savedFilesJSON);
        if (Array.isArray(savedFiles)) {
          const restoredFiles = savedFiles.map(sf => base64ToFile(sf.data, sf.name, sf.mimeType));
          setAttachedFiles(restoredFiles);
        }
      } catch (error) {
        console.error("Failed to parse or restore saved files:", error);
        localStorage.removeItem('messageDraft_files');
      }
    }
  }, []); // Run only once

  // Auto-save draft on change
  useEffect(() => {
    if (inputValue.trim() || attachedFiles.length > 0) {
      localStorage.setItem('messageDraft_text', inputValue);

      const saveFiles = async () => {
        try {
          const filesToSave: SavedFile[] = await Promise.all(
            attachedFiles.map(async (file) => ({
              name: file.name,
              mimeType: file.type,
              data: await fileToBase64(file),
            }))
          );
          localStorage.setItem('messageDraft_files', JSON.stringify(filesToSave));
        } catch (error) {
          console.error("Error saving files for draft:", error);
        }
      };

      if (attachedFiles.length > 0) {
        saveFiles();
      } else {
        localStorage.removeItem('messageDraft_files');
      }
    } else {
      localStorage.removeItem('messageDraft_text');
      localStorage.removeItem('messageDraft_files');
    }
  }, [inputValue, attachedFiles]);


  // Effect to sync state from voice input and handle auto-resizing/scrolling of the input field.
  useEffect(() => {
    const element = inputRef.current;
    if (element) {
        if (element.innerText !== inputValue) {
            element.innerText = inputValue;
        }
        const MAX_HEIGHT_PX = 192;
        element.style.height = 'auto';
        const scrollHeight = element.scrollHeight;
        if (scrollHeight > MAX_HEIGHT_PX) {
            element.style.height = `${MAX_HEIGHT_PX}px`;
            element.style.overflowY = 'auto';
        } else {
            element.style.height = `${scrollHeight}px`;
            element.style.overflowY = 'hidden';
        }
    }
  }, [inputValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles(prevFiles => [...prevFiles, ...Array.from(files)]);
    }
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading || isEnhancing) return;
    onSubmit(inputValue, attachedFiles, { isThinkingModeEnabled });
    setInputValue('');
    setAttachedFiles([]);
    localStorage.removeItem('messageDraft_text');
    localStorage.removeItem('messageDraft_files');
  };

  const handleEnhancePrompt = async () => {
    const originalPrompt = inputValue;
    if (!originalPrompt.trim() || isEnhancing || isLoading) return;
    
    setIsEnhancing(true);
    let enhancedText = '';
    
    try {
        const stream = enhanceUserPromptStream(originalPrompt);
        // Clear the input now that we are confident an enhancement is likely to succeed.
        setInputValue(''); 
        
        for await (const chunk of stream) {
            enhancedText += chunk;
            setInputValue(enhancedText);
        }

        // After the loop, if the final result is empty, it's a failure. Restore original.
        if (!enhancedText.trim()) {
            console.warn("Prompt enhancement resulted in an empty string. Restoring original.");
            setInputValue(originalPrompt);
        }

    } catch (e) {
        console.error("Error during prompt enhancement:", e);
        // On any error from the stream, restore the original prompt.
        setInputValue(originalPrompt);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleMicClick = () => {
    if (isLoading) return;
    if (isRecording) {
        stopRecording();
    } else {
        setInputValue('');
        startRecording();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const hasInput = inputValue.trim().length > 0 || attachedFiles.length > 0;
  const hasText = inputValue.trim().length > 0;

  const sendButtonClasses = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out";
  let sendButtonStateClasses = '';

  if (hasInput && !isLoading && !isEnhancing) {
    sendButtonStateClasses = 'bg-gray-400 dark:bg-slate-200 text-gray-800 dark:text-black';
  } else {
    sendButtonStateClasses = 'bg-gray-600 dark:bg-[#202123] text-gray-400 dark:text-slate-500';
  }

  return (
    <form 
        className="bg-gray-200/50 dark:bg-[#202123] border border-gray-300 dark:border-white/10 rounded-2xl flex flex-col p-2" 
        onSubmit={handleSubmit}
    >
        {/* File Preview Area */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden"
            >
              {attachedFiles.map((file, index) => (
                <motion.div key={`${file.name}-${index}`} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <AttachedFilePreview
                    file={file}
                    onRemove={() => handleRemoveFile(index)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Input and Buttons Row */}
        <div className="flex items-end gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
                multiple
                accept="image/*,video/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css"
            />

            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                title="Attach file"
                disabled={isLoading || isEnhancing}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
            </button>
            <div className="relative flex-grow">
              <div
                  ref={inputRef}
                  contentEditable={!isLoading && !isEnhancing}
                  onInput={(e) => setInputValue(e.currentTarget.innerText)}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat input"
                  role="textbox"
                  data-placeholder={isRecording ? 'Listening...' : "Ask anything"}
                  className={`content-editable-input w-full bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none ${isLoading || isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style={{
                    minHeight: '28px', // Base height for a single line
                    maxHeight: '192px',
                    transition: 'height 0.15s ease-out',
                  }}
              />
            </div>
            <AnimatePresence>
            {isSupported && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading || isEnhancing}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}
                >
                    {isRecording ? (
                        <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg>
                        </motion.div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg>
                    )}
                </motion.button>
            )}
            </AnimatePresence>

            <AnimatePresence>
              {hasText && attachedFiles.length === 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isLoading || isEnhancing}
                  aria-label="Enhance prompt"
                  title="Enhance prompt"
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                >
                  {isEnhancing ? (
                    <motion.div
                      className="w-4 h-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 00-3.375-3.375H8.25a3.375 3.375 0 00-3.375 3.375v2.25" />
                      </svg>
                    </motion.div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.422 2.22a.75.75 0 0 1 .862.053l4.25 3.5a.75.75 0 0 1-.053 1.328L10.5 8.165l2.121 2.122a.75.75 0 0 1-1.06 1.06L9.44 9.227a.75.75 0 0 1 0-1.06l4.25-4.25-1.928-1.593a.75.75 0 0 1 .66-1.328ZM3.79 8.29a.75.75 0 0 1 0 1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L5.81 15.5l-2.12-2.121a.75.75 0 0 1 1.06-1.06l2.12 2.121L3.79 8.29Z" clipRule="evenodd" />
                        <path d="m11.5 5.5.034-.034a.75.75 0 0 1 1.028.034l3.5 4.25a.75.75 0 0 1-1.114.996L12.5 7.695V14.5a.75.75 0 0 1-1.5 0V5.5Z" />
                    </svg>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setIsThinkingModeEnabled(!isThinkingModeEnabled)}
                disabled={isLoading || isEnhancing || attachedFiles.length > 0}
                aria-label={isThinkingModeEnabled ? 'Disable thinking mode' : 'Enable thinking mode (text only)'}
                title={isThinkingModeEnabled ? 'Disable thinking mode for complex reasoning' : 'Enable thinking mode for complex reasoning (text only)'}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isThinkingModeEnabled ? 'bg-purple-400/20 !text-purple-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a5.523 5.523 0 0 0-1.503 1.334c-.792.792-1.247 1.87-1.247 2.985v.253a.75.75 0 0 0 1.5 0v-.253c0-.8.316-1.55.879-2.113a4.023 4.023 0 0 1 2.113-.879H7.75V2.75Z" /><path d="M12.25 2.75a.75.75 0 0 1 1.5 0v1.258a5.523 5.523 0 0 1 1.503 1.334c.792.792-1.247 1.87-1.247 2.985v.253a.75.75 0 0 1-1.5 0v-.253c0-.8-.316-1.55-.879-2.113a4.023 4.023 0 0 0-2.113-.879H12.25V2.75Z" /><path fillRule="evenodd" d="M17 10c0-2.036-1.289-3.796-3.085-4.482A5.526 5.526 0 0 0 10 3.5a5.526 5.526 0 0 0-3.915 1.018C4.289 6.204 3 7.964 3 10c0 2.036 1.289 3.796 3.085 4.482A5.526 5.526 0 0 0 10 16.5a5.526 5.526 0 0 0 3.915-1.018C15.711 13.796 17 12.036 17 10ZM10 5a4.026 4.026 0 0 1 2.848.742A4.49 4.49 0 0 1 15.5 10a4.49 4.49 0 0 1-2.652 4.258A4.026 4.026 0 0 1 10 15a4.026 4.026 0 0 1-2.848-.742A4.49 4.49 0 0 1 4.5 10a4.49 4.49 0 0 1 2.652-4.258A4.026 4.026 0 0 1 10 5Z" clipRule="evenodd" /><path d="M7.75 12.25a.75.75 0 0 0-1.5 0v.253c0 1.114.455 2.193 1.247 2.985a5.523 5.523 0 0 0 1.503 1.334V18a.75.75 0 0 0 1.5 0v-1.178a4.023 4.023 0 0 1-2.113-.879.75.75 0 0 1-.879-2.113V12.25Z" /><path d="M12.25 12.25a.75.75 0 0 1 1.5 0v.253c0 1.114-.455 2.193-1.247 2.985a5.523 5.523 0 0 1-1.503 1.334V18a.75.75 0 0 1-1.5 0v-1.178a4.023 4.023 0 0 0 2.113-.879c.563-.564.879-1.314.879-2.113V12.25Z" /></svg>
            </button>
            
            <button
                type={isLoading ? 'button' : 'submit'}
                onClick={isLoading ? onCancel : undefined}
                disabled={!isLoading && (!hasInput || isEnhancing)}
                aria-label={isLoading ? "Stop generating" : "Send message"}
                title={isLoading ? "Stop generating" : "Send message"}
                className={`${sendButtonClasses} ${sendButtonStateClasses}`}
            >
                {isLoading ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 -mr-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                )}
            </button>
        </div>
    </form>
  );
};