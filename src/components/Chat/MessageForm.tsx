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
};

export const MessageForm = ({ onSubmit, isLoading }: MessageFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: setInputValue,
  });

  // Effect to sync state to the contentEditable div. This is necessary for updates
  // that don't originate from user typing, such as voice input or clearing the form.
  useEffect(() => {
    if (inputRef.current && inputRef.current.innerText !== inputValue) {
      inputRef.current.innerText = inputValue;
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

  return (
    <form 
        className="relative p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm" 
        onSubmit={handleSubmit}
    >
        <AnimatePresence>
        {attachedFiles.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
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

        <div className="flex items-end gap-2 p-2">
             <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                title="Attach file"
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:cursor-not-allowed transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
             </button>
            <div className="relative flex-grow">
              <div
                  ref={inputRef}
                  contentEditable={!isLoading}
                  onInput={(e) => setInputValue(e.currentTarget.innerText)}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat input"
                  role="textbox"
                  data-placeholder={isRecording ? 'Listening...' : "Attach files or send a command to the AI..."}
                  className={`content-editable-input w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none max-h-48 overflow-y-auto ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
             {isSupported && (
                <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:cursor-not-allowed transition-all ${isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}
                >
                    {isRecording ? (
                        <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg>
                        </motion.div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg>
                    )}
                </button>
             )}
        </div>
        
        <button 
            type="submit" 
            disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
            aria-label="Send message"
            title="Send message"
            className="absolute bottom-3 right-3 flex-shrink-0 w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-500/20"
        >
            {attachedFiles.length > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.03 9.83a.75.75 0 0 1-1.06-1.06l5.5-5.5a.75.75 0 0 1 1.06 0l5.5 5.5a.75.75 0 0 1-1.06 1.06L10.75 5.612V16.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a1.5 1.5 0 0 1 2.122 0l7.656 7.656-7.656 7.657a1.5 1.5 0 1 1-2.122-2.122L9.06 12 3.105 6.045a1.5 1.5 0 0 1 0-2.122Z" clipRule="evenodd" /></svg>
            )}
        </button>
    </form>
  );
};