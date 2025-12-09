/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const isGeneratingResponse = isLoading;
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.length > 0 || logic.processedFiles.length > 0;
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  const isSendDisabled = isBackendOffline || isAppLoading || isProcessingFiles || logic.isEnhancing || !hasInput || !hasApiKey;
  
  // Standardized Icon Button Class
  const iconBtnClass = `
    flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
    text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-300
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500
  `;

  return (
    <div className="w-full mx-auto">
      <form onSubmit={logic.handleSubmit} className="relative">
        <motion.div 
            className={`
              relative flex flex-col bg-white dark:bg-[#1e1e1e] shadow-lg dark:shadow-2xl
              rounded-[24px] sm:rounded-[32px] transition-shadow duration-300
              ${logic.isFocused 
                ? 'shadow-xl ring-1 ring-black/5 dark:ring-white/10' 
                : 'shadow-md border border-slate-200/60 dark:border-white/5'
              }
            `}
            layout
        >
            {/* Top Section: Suggestions & Files */}
            <AnimatePresence>
                {(logic.proactiveSuggestions.length > 0 || logic.processedFiles.length > 0) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pt-3 flex flex-col gap-2"
                    >
                        {logic.proactiveSuggestions.length > 0 && (
                            <ProactiveAssistance suggestions={logic.proactiveSuggestions} onSuggestionClick={logic.handleSuggestionClick} />
                        )}
                        {logic.processedFiles.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {logic.processedFiles.map((pf) => (
                                    <AttachedFilePreview 
                                        key={pf.id} 
                                        file={pf.file} 
                                        onRemove={() => logic.handleRemoveFile(pf.id)} 
                                        progress={pf.progress} 
                                        error={pf.error} 
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Hidden Inputs */}
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            {/* Main Input Area */}
            <div className="flex items-end gap-2 p-2 sm:p-3">
                {/* Left Actions (Attach) */}
                <div className="relative flex-shrink-0 pb-0.5">
                    <button 
                        ref={logic.attachButtonRef} 
                        type="button" 
                        onClick={() => logic.setIsUploadMenuOpen(p => !p)} 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className={iconBtnClass}
                        title="Attach files"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>

                {/* Textarea */}
                <div className="relative flex-grow min-h-[44px] py-2">
                  <AnimatePresence mode="popLayout">
                    {!hasInput && !logic.isFocused && (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0 } }}
                            className="absolute inset-0 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none text-base sm:text-sm"
                        >
                            <TextType
                                text={logic.placeholder}
                                loop={true}
                                typingSpeed={60}
                                deletingSpeed={40}
                                pauseDuration={3000}
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
                    className={`w-full bg-transparent text-slate-900 dark:text-slate-100 text-base sm:text-sm focus:outline-none resize-none leading-relaxed placeholder:text-transparent max-h-[200px] overflow-y-auto custom-scrollbar ${logic.isEnhancing ? 'opacity-50' : ''}`}
                    rows={1}
                    style={{ minHeight: '24px' }}
                  />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-2 pb-0.5">
                    {/* Enhance Button */}
                    <AnimatePresence>
                      {hasText && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8, width: 0 }} 
                            animate={{ opacity: 1, scale: 1, width: 'auto' }} 
                            exit={{ opacity: 0, scale: 0.8, width: 0 }} 
                            type="button" 
                            onClick={logic.handleEnhancePrompt} 
                            disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                            className={iconBtnClass}
                            title="Enhance prompt with AI"
                        >
                          {logic.isEnhancing ? ( 
                            <svg className="animate-spin w-4 h-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : ( 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 3.25L7.38 14.14 2.38 9.27l6.91-1.01L12 2z"></path></svg> 
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* Mic Button */}
                    <AnimatePresence>
                        {logic.isSupported && !hasText && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                type="button"
                                onClick={logic.handleMicClick}
                                disabled={isLoading || logic.isEnhancing || isAppLoading || !hasApiKey}
                                className={`${iconBtnClass} ${logic.isRecording ? 'text-red-500 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30' : ''}`}
                            >
                                {logic.isRecording ? (
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Send Button */}
                    <motion.button
                        type="button"
                        onClick={isGeneratingResponse ? onCancel : logic.handleSubmit} // FIX: Call handleSubmit correctly
                        disabled={!isGeneratingResponse && isSendDisabled}
                        aria-label={isGeneratingResponse ? "Stop generating" : "Send message"}
                        className={`
                            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md
                            ${isGeneratingResponse 
                                ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20' 
                                : isSendDisabled 
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/25 hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {isGeneratingResponse ? ( 
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                                <rect x="18" y="18" width="12" height="12" rx="2" ry="2" fill="currentColor"></rect>
                                <circle cx="24" cy="24" r="16" fill="none" stroke="#4f46e5" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="80 100" strokeDashoffset="0">
                                    <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="2.5s" repeatCount="indefinite"></animateTransform>
                                    <animate attributeName="stroke-dashoffset" values="0; -180" dur="2.5s" repeatCount="indefinite"></animate>
                                    <animate attributeName="stroke" dur="10s" repeatCount="indefinite" values="#f87171; #fb923c; #facc15; #4ade80; #22d3ee; #3b82f6; #818cf8; #e879f9; #f472b6; #f87171"></animate>
                                </circle>
                            </svg>
                        ) : ( 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                         )}
                    </motion.button>
                </div>
            </div>
            
            {/* Footer / Mode Toggle */}
            <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex-1"></div> {/* Spacer */}
                <div className="flex justify-center">
                    <ModeToggle 
                        isAgentMode={isAgentMode} 
                        onToggle={setIsAgentMode}
                        disabled={isLoading || isAppLoading || isBackendOffline}
                    />
                </div>
                <div className="flex-1 text-right">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium hidden sm:inline-block">
                        Agentic AI v1.0
                    </span>
                </div>
            </div>
        </motion.div>
      </form>
      
      <div className="flex justify-center mt-3 mb-1">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center">
             AI can make mistakes. Check important info.
          </p>
      </div>
    </div>
  );
});