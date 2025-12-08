
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This is the view part of the refactored MessageForm component.
// All logic is now handled by the `useMessageForm` hook.

import React, { forwardRef } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { AttachedFilePreview } from './AttachedFilePreview';
import { ProactiveAssistance } from './ProactiveAssistance';
import { UploadMenu } from './UploadMenu';
import { useMessageForm } from './useMessageForm';
import { type MessageFormHandle } from './types';
import { ModeToggle } from '../../UI/ModeToggle';
import { TextType } from '../../UI/TextType';
import type { Message } from '../../../types';

const motion = motionTyped as any;

export const MessageForm = forwardRef<MessageFormHandle, {
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void;
  isLoading: boolean;
  isAppLoading: boolean;
  backendStatus: 'online' | 'offline' | 'checking';
  onCancel: () => void;
  isAgentMode: boolean;
  setIsAgentMode: (isAgent: boolean) => void;
  messages: Message[];
  hasApiKey: boolean;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
}>(({ onSubmit, isLoading, onCancel, isAppLoading, backendStatus, isAgentMode, setIsAgentMode, messages, hasApiKey, ttsVoice, setTtsVoice }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref, messages, isAgentMode, hasApiKey);
  
  const isBackendOffline = backendStatus !== 'online';
  const isBackendChecking = backendStatus === 'checking';
  // isConnecting variable removed as it was only used for the spinner
  const isGeneratingResponse = isLoading;
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.length > 0 || logic.processedFiles.length > 0; // Check length directly for speed
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  // The button is disabled if the app isn't ready or there's nothing to send.
  // It is NOT disabled when generating, because it becomes a cancel button.
  const isSendDisabled = isBackendOffline || isAppLoading || isProcessingFiles || logic.isEnhancing || !hasInput || !hasApiKey;
  
  const sendButtonClasses = "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out shadow-sm";

  // Determine button color and state
  let sendButtonStateClasses = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-slate-600 cursor-not-allowed'; // Default disabled
  if (isGeneratingResponse) {
    sendButtonStateClasses = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-red-500/50 hover:border-red-50 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md'; // Stop state
  } else if (!isSendDisabled) {
    sendButtonStateClasses = 'bg-indigo-600 text-white hover:bg-indigo-50 shadow-indigo-500/20 shadow-md transform hover:-translate-y-0.5'; // Active state
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={logic.handleSubmit} className="relative">
        <motion.div 
            className={`
              relative flex flex-col p-3 rounded-[1.25rem] transition-colors duration-300 border
              ${logic.isFocused 
                ? 'bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-white/20' 
                : 'bg-transparent border-gray-200 dark:border-white/5'
              }
            `}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Proactive Assistance */}
            <AnimatePresence>
                {logic.proactiveSuggestions.length > 0 && (
                    <div className="mb-2 overflow-hidden">
                        <ProactiveAssistance suggestions={logic.proactiveSuggestions} onSuggestionClick={logic.handleSuggestionClick} />
                    </div>
                )}
            </AnimatePresence>

            {/* File Previews */}
            <AnimatePresence>
                {logic.processedFiles.length > 0 && (
                    <motion.div 
                        layout 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="mb-3 flex flex-col gap-2 px-1"
                    >
                        {logic.processedFiles.map((pf) => (
                            <AttachedFilePreview 
                                key={pf.id} 
                                file={pf.file} 
                                onRemove={() => logic.handleRemoveFile(pf.id)} 
                                progress={pf.progress} 
                                error={pf.error} 
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Hidden Inputs */}
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            {/* Main Input Area */}
            <div className="relative flex-grow min-h-[56px] px-2">
              <AnimatePresence mode="popLayout">
                {!hasInput && !logic.isFocused && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        // CRITICAL OPTIMIZATION: duration: 0 ensures instant removal to prevent "ghost writing" overlay
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        // CRITICAL OPTIMIZATION: pointer-events-none ensures clicks pass through to textarea
                        className="absolute inset-0 py-3.5 text-gray-400 dark:text-slate-500 pointer-events-none select-none truncate font-medium z-0"
                        aria-hidden="true"
                    >
                        <TextType
                            text={logic.placeholder}
                            loop={true}
                            typingSpeed={65}
                            deletingSpeed={50}
                            pauseDuration={2000}
                            showCursor={false}
                        />
                    </motion.div>
                )}
              </AnimatePresence>
              <textarea
                ref={logic.inputRef}
                value={logic.inputValue}
                onChange={(e) => logic.setInputValue(e.target.value)}
                onKeyDown={logic.handleKeyDown}
                onPaste={logic.handlePaste}
                onFocus={() => logic.setIsFocused(true)}
                onBlur={() => logic.setIsFocused(false)}
                aria-label="Chat input"
                disabled={!hasApiKey}
                className={`w-full py-3.5 bg-transparent text-gray-900 dark:text-slate-100 focus:outline-none relative z-10 resize-none overflow-hidden leading-relaxed ${logic.isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '56px', maxHeight: '200px' }}
                rows={1}
              />
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5 px-1">
              <div className="flex items-center gap-1">
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode}
                    disabled={isLoading || isAppLoading || isBackendOffline}
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Attachment Button */}
                <div className="relative">
                    <motion.button 
                        ref={logic.attachButtonRef} 
                        type="button" 
                        onClick={() => logic.setIsUploadMenuOpen(p => !p)} 
                        aria-label="Attach files" 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    </motion.button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>
                
                {/* Voice Input */}
                <AnimatePresence>
                  {logic.isSupported && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8, width: 0 }} 
                        animate={{ opacity: 1, scale: 1, width: 'auto' }} 
                        exit={{ opacity: 0, scale: 0.8, width: 0 }} 
                        type="button" 
                        onClick={logic.handleMicClick} 
                        disabled={isLoading || logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${logic.isRecording ? 'bg-red-50 text-red-500 dark:bg-red-500/20' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                        whileTap={{ scale: 0.9 }}
                        title={logic.isRecording ? "Stop recording" : "Voice input"}
                      >
                          {logic.isRecording ? ( 
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }} 
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                            </motion.div> 
                          ) : ( 
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg> 
                          )}
                      </motion.button>
                  )}
                </AnimatePresence>

                {/* Enhance Prompt */}
                <AnimatePresence>
                  {hasText && (
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.8, width: 0 }} 
                        animate={{ opacity: 1, scale: 1, width: 'auto' }} 
                        exit={{ opacity: 0, scale: 0.8, width: 0 }} 
                        type="button" 
                        onClick={logic.handleEnhancePrompt} 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                        title="Enhance prompt with AI"
                        whileTap={{ scale: 0.9 }}
                    >
                      {logic.isEnhancing ? ( 
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                        </motion.div> 
                      ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 3.25L7.38 14.14 2.38 9.27l6.91-1.01L12 2z"></path></svg> 
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
                
                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                {/* Submit Button */}
                <motion.button
                    type={isGeneratingResponse ? 'button' : 'submit'}
                    onClick={isGeneratingResponse ? onCancel : undefined}
                    disabled={isGeneratingResponse ? false : isSendDisabled}
                    aria-label={isGeneratingResponse ? "Stop generating" : "Send message"}
                    title={
                        isBackendChecking ? "Connecting to server..." :
                        isBackendOffline ? "Server offline" :
                        isAppLoading ? "Initializing..." :
                        isProcessingFiles ? "Processing files..." :
                        isGeneratingResponse ? "Stop generating" :
                        !hasApiKey ? "API key missing. Check Settings." :
                        "Send message"
                    }
                    className={`${sendButtonClasses} ${sendButtonStateClasses}`}
                    whileTap={{ scale: 0.95 }}
                >
                    {isGeneratingResponse ? ( 
                       <div className="w-6 h-6 flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                           <rect x="6" y="6" width="12" height="12" rx="2" />
                         </svg>
                       </div>
                    ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                     )}
                </motion.button>
              </div>
            </div>
        </motion.div>
      </form>
      
      <div className="flex justify-center mt-2">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
             AI can make mistakes. Check important info.
          </p>
      </div>
    </div>
  );
});
