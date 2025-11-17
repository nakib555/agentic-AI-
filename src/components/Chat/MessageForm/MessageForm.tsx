/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This is the view part of the refactored MessageForm component.
// All logic is now handled by the `useMessageForm` hook.

import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttachedFilePreview } from './AttachedFilePreview';
import { ProactiveAssistance } from './ProactiveAssistance';
import { UploadMenu } from './UploadMenu';
import { useMessageForm } from './useMessageForm';
import { type MessageFormHandle } from './types';
import { ModeToggle } from '../../UI/ModeToggle';
import { TextType } from '../../UI/TextType';
import type { Message } from '../../../types';

export const MessageForm = forwardRef<MessageFormHandle, {
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void;
  isLoading: boolean;
  isAppLoading: boolean;
  backendStatus: 'online' | 'offline' | 'checking';
  onCancel: () => void;
  isAgentMode: boolean;
  setIsAgentMode: (isAgent: boolean) => void;
  messages: Message[];
}>(({ onSubmit, isLoading, onCancel, isAppLoading, backendStatus, isAgentMode, setIsAgentMode, messages }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref, messages, isAgentMode);
  
  const isBackendOffline = backendStatus !== 'online';
  const isGeneratingResponse = isLoading;
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.trim().length > 0 || logic.processedFiles.length > 0;
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  // The button is disabled if the app isn't ready or there's nothing to send.
  // It is NOT disabled when generating, because it becomes a cancel button.
  const isSendDisabled = isBackendOffline || isAppLoading || isProcessingFiles || logic.isEnhancing || !hasInput;
  
  const sendButtonClasses = "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out";

  // Determine button color and state
  let sendButtonStateClasses = 'bg-gray-200 dark:bg-black/20 text-gray-400 dark:text-slate-500'; // Default disabled
  if (isGeneratingResponse) {
    sendButtonStateClasses = 'bg-transparent'; // Spinner state
  } else if (!isSendDisabled) {
    sendButtonStateClasses = 'bg-indigo-600 text-white hover:bg-indigo-500'; // Active state
  }

  return (
    <div>
      <form onSubmit={logic.handleSubmit}>
        <motion.div 
            className={`bg-theme-bg-light dark:bg-[#121212] border-[1px] border-[rgb(206,217,239)] dark:border-slate-700/50 flex flex-col p-2 flex-grow rounded-2xl`} 
            transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
            <AnimatePresence>
                {logic.proactiveSuggestions.length > 0 && (
                    <ProactiveAssistance suggestions={logic.proactiveSuggestions} onSuggestionClick={logic.handleSuggestionClick} />
                )}
            </AnimatePresence>
            <AnimatePresence>
            {logic.processedFiles.length > 0 && (
                <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="mb-2 flex flex-col gap-2">
                {logic.processedFiles.map((pf) => (
                    <motion.div key={pf.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <AttachedFilePreview file={pf.file} onRemove={() => logic.handleRemoveFile(pf.id)} progress={pf.progress} error={pf.error} />
                    </motion.div>
                ))}
                </motion.div>
            )}
            </AnimatePresence>
            
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            <div className="relative flex-grow">
              <AnimatePresence>
                {!hasInput && !logic.isFocused && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 px-2 py-1.5 text-gray-500 dark:text-slate-400 pointer-events-none"
                    >
                        <TextType
                            text={logic.placeholder}
                            loop={true}
                            typingSpeed={65}
                            deletingSpeed={50}
                            pauseDuration={2000}
                            showCursor={false}
                            cursorBlinkDuration={0.5}
                        />
                    </motion.div>
                )}
              </AnimatePresence>
              <textarea
                ref={logic.inputRef}
                disabled={logic.isEnhancing || isAppLoading || isBackendOffline}
                value={logic.inputValue}
                onChange={(e) => logic.setInputValue(e.target.value)}
                onKeyDown={logic.handleKeyDown}
                onPaste={logic.handlePaste}
                onFocus={() => logic.setIsFocused(true)}
                onBlur={() => logic.setIsFocused(false)}
                aria-label="Chat input"
                className={`content-editable-input w-full px-2 py-1.5 bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none relative z-10 resize-none overflow-hidden ${logic.isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '56px', maxHeight: '192px' }}
                rows={1}
              />
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-1">
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode}
                    disabled={isLoading || isAppLoading || isBackendOffline}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                    <button ref={logic.attachButtonRef} type="button" onClick={() => logic.setIsUploadMenuOpen(p => !p)} aria-label="Attach files or folder" title="Attach files or folder" disabled={logic.isEnhancing || isAppLoading || isBackendOffline} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path clipRule="evenodd" d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5H3.75a.75.75 0 010-1.5h5.5V3.75A.75.75 0 0110 3z" /></svg>
                    </button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {logic.isSupported && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleMicClick} disabled={isLoading || logic.isEnhancing || isAppLoading || isBackendOffline} aria-label={logic.isRecording ? 'Stop recording' : 'Start recording'} title={logic.isRecording ? 'Stop recording' : 'Start recording'} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${logic.isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}>
                          {logic.isRecording ? ( <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg> )}
                      </motion.button>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {hasText && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleEnhancePrompt} disabled={logic.isEnhancing || isAppLoading || isBackendOffline} aria-label="Enhance prompt" title="Enhance prompt" className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                      {logic.isEnhancing ? ( <motion.div className="w-4 h-4" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 00-3.375-3.375H8.25a3.375 3.375 0 00-3.375 3.375v2.25" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.422 2.22a.75.75 0 0 1 .862.053l4.25 3.5a.75.75 0 0 1-.053 1.328L10.5 8.165l2.121 2.122a.75.75 0 0 1-1.06 1.06L9.44 9.227a.75.75 0 0 1 0-1.06l4.25-4.25-1.928-1.593a.75.75 0 0 1 .66-1.328ZM3.79 8.29a.75.75 0 0 1 0 1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L5.81 15.5l-2.12-2.121a.75.75 0 0 1 1.06-1.06l2.12 2.121L3.79 8.29Z" clipRule="evenodd" /><path d="m11.5 5.5.034-.034a.75.75 0 0 1 1.028.034l3.5 4.25a.75.75 0 0 1-1.114.996L12.5 7.695V14.5a.75.75 0 0 1-1.5 0V5.5Z" /></svg> )}
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                    type={isGeneratingResponse ? 'button' : 'submit'}
                    onClick={isGeneratingResponse ? onCancel : undefined}
                    disabled={isGeneratingResponse ? false : isSendDisabled}
                    aria-label={isGeneratingResponse ? "Stop generating" : "Send message"}
                    title={
                        isBackendOffline ? "Server not connected" :
                        isAppLoading ? "Initializing..." :
                        isProcessingFiles ? "Processing files..." :
                        isGeneratingResponse ? "Stop generating" :
                        "Send message"
                    }
                    className={`${sendButtonClasses} ${sendButtonStateClasses}`}
                >
                    {isGeneratingResponse ? ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-label="loading" className="w-6 h-6">
                            {/* Background circle */}
                            <circle
                                cx="24" cy="24" r="22"
                                className="fill-white"
                            />
                        
                            {/* Stop box in the center, themed for visibility */}
                            <rect
                                x="20" y="20"
                                width="8" height="8"
                                rx="2" ry="2"
                                className="fill-slate-800 dark:fill-slate-100"
                            />
                        
                            {/* Animated ring spinner on top */}
                            <circle
                                cx="24" cy="24" r="16"
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeDasharray="80 100"
                                strokeDashoffset="0"
                            >
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 24 24"
                                    to="360 24 24"
                                    dur="2.5s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="stroke-dashoffset"
                                    values="0; -180"
                                    dur="2.5s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="stroke"
                                    dur="10s"
                                    repeatCount="indefinite"
                                    values="#f87171;#fb923c;#facc15;#4ade80;#22d3ee;#3b82f6;#818cf8;#e879f9;#f472b6;#f87171"
                                />
                            </circle>
                        </svg>
                    ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
                            <g transform="matrix(0.8, 0, 0, 0.8, 51.2, 56.2)">
                                <path d="M481.508 210.335 68.414 38.926c-17.403-7.222-37.063-4.045-51.309 8.287C2.859 59.547-3.099 78.55 1.557 96.808L42.151 256 1.557 415.192c-4.656 18.258 1.301 37.261 15.547 49.595 14.273 12.358 33.938 15.495 51.31 8.287l413.094-171.409C500.316 293.861 512 276.363 512 256s-11.684-37.861-30.492-45.665zm-11.499 63.62L56.916 445.364c-6.947 2.881-14.488 1.665-20.175-3.259-5.686-4.923-7.971-12.212-6.113-19.501L69.287 271h149.065c8.285 0 15.001-6.716 15.001-15.001s-6.716-15.001-15.001-15.001H69.288L30.628 89.396c-1.858-7.288.427-14.578 6.113-19.501 5.686-4.923 13.225-6.141 20.174-3.259l413.094 171.409c11.125 4.616 11.99 14.91 11.99 17.955s-.865 13.339-11.99 17.955z" fill="currentColor" />
                            </g>
                        </svg>
                     )}
                </button>
              </div>
            </div>
        </motion.div>
      </form>
      <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-2 px-4">
          Gemini can make mistakes. Check important info.
      </p>
    </div>
  );
});