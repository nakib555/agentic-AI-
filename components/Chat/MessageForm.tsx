/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useVoiceInput } from '../../hooks/useVoiceInput';

type MessageFormProps = {
  onSubmit: (message: string) => void;
  isLoading: boolean;
};

export const MessageForm = ({ onSubmit, isLoading }: MessageFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: (transcript) => {
        setInputValue(transcript);
    },
  });
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isRecording) {
        stopRecording();
    }
    if (!inputValue.trim() || isLoading) return;
    onSubmit(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
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

  return (
    <form 
        className="relative p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm" 
        onSubmit={handleSubmit}
    >
        <div className="flex items-center gap-2 p-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                <path d="M15.5 2.25a2.25 2.25 0 0 0-2.25 2.25c0 1.052.72 1.933 1.706 2.182A3.002 3.002 0 0 1 12 9.75a3 3 0 1 1-6 0 3.002 3.002 0 0 1-2.956-3.068A2.25 2.25 0 0 0 4.5 4.5a2.25 2.25 0 0 0 0 4.5 2.25 2.25 0 0 0 2.25-2.25c0-1.052-.72-1.933-1.706-2.182A3.002 3.002 0 0 1 8 1.75a3 3 0 0 1 6 0 3.002 3.002 0 0 1 2.956 3.068A2.25 2.25 0 0 0 15.5 9a2.25 2.25 0 0 0 0-4.5 2.25 2.25 0 0 0-2.25-2.25Z" />
             </svg>

            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? 'Listening...' : "Initiate a query or send a command to the AI..."}
                aria-label="Chat input"
                disabled={isLoading}
                rows={1}
                className="flex-grow w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none disabled:opacity-50"
            />
             <button 
                type="button" 
                aria-label="Attach file"
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
        
        {(inputValue && !isRecording) && (
             <motion.button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()} 
                aria-label="Send message"
                className="absolute bottom-3 right-3 flex-shrink-0 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-500/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a1.5 1.5 0 0 1 2.122 0l7.656 7.656-7.656 7.657a1.5 1.5 0 1 1-2.122-2.122L9.06 12 3.105 6.045a1.5 1.5 0 0 1 0-2.122Z" clipRule="evenodd" /></svg>
            </motion.button>
        )}
    </form>
  );
};