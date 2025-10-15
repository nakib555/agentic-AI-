/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { AttachedFilePreview } from './AttachedFilePreview';

type MessageFormProps = {
  onSubmit: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onCancel: () => void;
};

export const MessageForm = ({ onSubmit, isLoading, onCancel }: MessageFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: setInputValue,
  });

  // Effect to sync state from voice input and handle auto-resizing/scrolling of the input field.
  useEffect(() => {
    const element = inputRef.current;
    if (element) {
        // Sync state to the contentEditable div if it's different.
        // This is primarily for voice input updates.
        if (element.innerText !== inputValue) {
            element.innerText = inputValue;
        }

        const MAX_HEIGHT_PX = 192; // Corresponds to Tailwind's max-h-48 (12rem)

        // Temporarily reset height to allow the element to shrink and to
        // accurately calculate the new scrollHeight.
        element.style.height = 'auto';

        const scrollHeight = element.scrollHeight;

        // Apply new height or cap it at max-height and enable scrolling
        if (scrollHeight > MAX_HEIGHT_PX) {
            element.style.height = `${MAX_HEIGHT_PX}px`;
            element.style.overflowY = 'auto';
        } else {
            // The scrollHeight gives the perfect height to fit the content.
            element.style.height = `${scrollHeight}px`;
            element.style.overflowY = 'hidden';
        }

        // Auto-scroll to the bottom if the input is scrollable.
        // This ensures the cursor is always visible when typing a long message.
        if (element.scrollHeight > element.clientHeight) {
            element.scrollTop = element.scrollHeight;
        }
    }
  }, [inputValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles(prevFiles => [...prevFiles, ...Array.from(files)]);
    }
    // Clear the input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const removeFile = (fileToRemove: File) => {
    setAttachedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isRecording) {
        stopRecording();
    }
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;
    onSubmit(inputValue, attachedFiles);
    setInputValue('');
    setAttachedFiles([]);
  };

  const handleMicClick = () => {
    if (isLoading) return;
    if (isRecording) {
        stopRecording();
    } else {
        setInputValue(''); // Clear input before starting a new recording
        startRecording();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSubmit(e);
    }
  };
  
  const hasInput = inputValue.trim().length > 0 || attachedFiles.length > 0;

  const buttonBaseClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-current dark:focus:ring-offset-black/50 focus:ring-blue-400";
  let buttonStateClasses = '';

  if (isLoading) {
    buttonStateClasses = 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white';
  } else if (hasInput) {
    buttonStateClasses = 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-teal-400 dark:to-green-400 text-white shadow-md';
  } else {
    buttonStateClasses = 'bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed';
  }

  return (
    <form 
        className="relative p-2 bg-white/80 dark:bg-black/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg" 
        onSubmit={handleSubmit}
    >
        <AnimatePresence>
        {attachedFiles.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-b border-gray-200 dark:border-white/10 mb-2"
            >
                {attachedFiles.map((file, index) => (
                  <AttachedFilePreview 
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(file)}
                  />
                ))}
            </motion.div>
        )}
        </AnimatePresence>

        {/* Hidden file input, always present for the ref */}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
            multiple
        />

        <div className="flex items-end gap-2">
             <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                title="Attach file"
                disabled={isLoading}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
             </button>
            <div className="relative flex-grow">
              <div
                  ref={inputRef}
                  contentEditable={!isLoading}
                  onInput={(e) => setInputValue(e.currentTarget.innerText)}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat input"
                  role="textbox"
                  data-placeholder={isRecording ? 'Listening...' : "Send a message or ask me anything..."}
                  className={`content-editable-input modern-scrollbar w-full bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style={{
                    minHeight: '24px', // Base height for a single line
                    transition: 'height 0.15s ease-out',
                  }}
              />
            </div>
             {isSupported && (
                <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}
                >
                    {isRecording ? (
                        <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg>
                        </motion.div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg>
                    )}
                </button>
             )}
            <button
                type={isLoading ? 'button' : 'submit'}
                onClick={isLoading ? onCancel : undefined}
                disabled={!isLoading && !hasInput}
                aria-label={isLoading ? "Stop generating" : "Send message"}
                title={isLoading ? "Stop generating" : "Send message"}
                className={`${buttonBaseClasses} ${buttonStateClasses}`}
            >
                {isLoading ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-6.75-6.75M12 19.5l6.75-6.75" />
                    </svg>
                )}
            </button>
        </div>
    </form>
  );
};