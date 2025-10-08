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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: (transcript) => {
        setInputValue(transcript);
    },
  });

  // Effect to auto-resize the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to allow shrinking
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      if (e.currentTarget.form) {
          e.currentTarget.form.requestSubmit();
      }
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
                className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
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
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600" aria-hidden="true">
                <path d="M12 4C13.1046 4 14 4.89543 14 6V7.67451C15.8457 8.21661 17.2166 9.58752 17.7587 11.4332H19.4332C20.5378 11.4332 21.4332 12.3287 21.4332 13.4332C21.4332 14.5378 20.5378 15.4332 19.4332 15.4332H17.7587C17.2166 17.2789 15.8457 18.6498 14 19.1919V20.8665C14 21.9711 13.1046 22.8665 12 22.8665C10.8954 22.8665 10 21.9711 10 20.8665V19.1919C8.15432 18.6498 6.7834 17.2789 6.24131 15.4332H4.56681C3.46224 15.4332 2.56681 14.5378 2.56681 13.4332C2.56681 12.3287 3.46224 11.4332 4.56681 11.4332H6.24131C6.7834 9.58752 8.15432 8.21661 10 7.67451V6C10 4.89543 10.8954 4 12 4ZM12 9.14155C9.88142 9.14155 8.14155 10.8814 8.14155 13C8.14155 15.1186 9.88142 16.8584 12 16.8584C14.1186 16.8584 15.8584 15.1186 15.8584 13C15.8584 10.8814 14.1186 9.14155 12 9.14155Z" fill="currentColor"/>
              </svg>
            </div>

            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? 'Listening...' : "Attach files or send a command to the AI..."}
                aria-label="Chat input"
                disabled={isLoading}
                rows={1}
                className="flex-grow w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50 max-h-48"
            />
             <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                title="Attach file"
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:cursor-not-allowed transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3.375 3.375 0 1 1 18.374 7.5l-1.496 1.496a1.125 1.125 0 0 1-1.591 0Z" /></svg>
             </button>
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg>
                        </motion.div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg>
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