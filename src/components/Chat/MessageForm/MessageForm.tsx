
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { AttachedFilePreview } from './AttachedFilePreview';
import { UploadMenu } from './UploadMenu';
import { useMessageForm } from './useMessageForm';
import { type MessageFormHandle } from './types';
import { ModeToggle } from '../../UI/ModeToggle';
import { TextType } from '../../UI/TextType';
import type { Message } from '../../../types';
import { VoiceVisualizer } from '../../UI/VoiceVisualizer';

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
  currentChatId?: string | null;
  activeModel?: string;
}>(({ onSubmit, isLoading, onCancel, isAppLoading, backendStatus, isAgentMode, setIsAgentMode, messages, hasApiKey }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref, messages, isAgentMode, hasApiKey);
  
  const isBackendOffline = backendStatus !== 'online';
  const isGeneratingResponse = isLoading;
  const isSendDisabled = !logic.canSubmit || isBackendOffline || isAppLoading || !hasApiKey;
  
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;
  const hasInput = logic.inputValue.length > 0 || logic.processedFiles.length > 0;

  return (
    <div className="w-full mx-auto px-4 pb-4 max-w-4xl">
      <form onSubmit={logic.handleSubmit} className="relative">
        <motion.div 
            className={`
              relative flex flex-col
              bg-white dark:bg-[#0a0a0a] /* Deep dark background */
              border-2 border-slate-200 dark:border-white/10
              rounded-[32px] /* Large rounded corners */
              transition-all duration-300
              ${logic.isFocused ? 'border-indigo-500/50 dark:border-indigo-400/50 shadow-lg shadow-indigo-500/10' : 'shadow-sm'}
            `}
            layout
        >
            {/* --- Voice Visualizer Overlay --- */}
            <VoiceVisualizer isRecording={logic.isRecording} />

            {/* --- File Previews (Push content down) --- */}
            <AnimatePresence>
                {(logic.processedFiles.length > 0) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-4 pt-4"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>
            
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            {/* --- Main Input Area --- */}
            <div className="flex items-start gap-4 p-4 min-h-[88px]">
                {/* Left: Plus Button */}
                <div className="relative flex-shrink-0 pt-2">
                    <button 
                        ref={logic.attachButtonRef} 
                        type="button" 
                        onClick={() => logic.setIsUploadMenuOpen(p => !p)} 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        title="Attach files"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( 
                            <div className="absolute bottom-full left-0 mb-2 z-20">
                                <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> 
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Center: Text Input */}
                <div className="flex-grow relative pt-2">
                  <AnimatePresence mode="popLayout">
                    {!hasInput && !logic.isFocused && (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0 } }}
                            className="absolute inset-0 text-slate-400 dark:text-slate-500 pointer-events-none select-none text-lg"
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
                    className={`w-full bg-transparent text-slate-800 dark:text-slate-200 text-lg focus:outline-none resize-none leading-relaxed placeholder:text-transparent max-h-[300px] overflow-y-auto custom-scrollbar ${logic.isEnhancing ? 'opacity-50' : ''}`}
                    rows={1}
                    style={{ minHeight: '32px' }}
                  />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 pt-1 flex-shrink-0">
                    {/* Enhance Prompt */}
                    <AnimatePresence>
                      {hasText && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.8 }} 
                            type="button" 
                            onClick={logic.handleEnhancePrompt} 
                            disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all"
                            title="Enhance prompt"
                        >
                          {logic.isEnhancing ? ( 
                            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }} 
                                type="button" 
                                onClick={logic.handleMicClick}
                                disabled={isLoading || logic.isEnhancing || isAppLoading || !hasApiKey}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${logic.isRecording ? 'text-red-500 bg-red-50 dark:bg-red-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                {logic.isRecording ? (
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Send Button */}
                    <motion.button
                        type="button"
                        onClick={isGeneratingResponse ? onCancel : logic.handleSubmit}
                        disabled={!isGeneratingResponse && isSendDisabled}
                        aria-label={isGeneratingResponse ? "Stop generating" : "Send message"}
                        className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md
                            ${isGeneratingResponse 
                                ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20' 
                                : isSendDisabled 
                                    ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/20 cursor-not-allowed shadow-none' 
                                    : 'bg-indigo-600 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-indigo-500 dark:hover:bg-white hover:scale-105 hover:shadow-indigo-500/25'
                            }
                        `}
                    >
                        {isGeneratingResponse ? ( 
                           <div className="w-4 h-4 bg-current rounded-sm"></div>
                        ) : ( 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                         )}
                    </motion.button>
                </div>
            </div>
            
            {/* --- Bottom Footer Area --- */}
            <div className="relative h-14 w-full">
                {/* Mode Toggle - Centered */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0">
                    <ModeToggle 
                        isAgentMode={isAgentMode} 
                        onToggle={setIsAgentMode}
                        disabled={isLoading || isAppLoading || isBackendOffline}
                    />
                </div>
                
                {/* Version Text - Bottom Right */}
                <div className="absolute right-6 top-3 text-xs font-medium text-slate-400 dark:text-white/20 select-none">
                    Agentic AI v1.0
                </div>
            </div>

        </motion.div>
      </form>
    </div>
  );
});
