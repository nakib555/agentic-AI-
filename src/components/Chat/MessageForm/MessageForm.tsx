
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
}>(({ onSubmit, isLoading, onCancel, isAppLoading, backendStatus, isAgentMode, setIsAgentMode, messages, hasApiKey }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref, messages, isAgentMode, hasApiKey);
  
  const isBackendOffline = backendStatus !== 'online';
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.length > 0 || logic.processedFiles.length > 0;
  const isSendDisabled = isBackendOffline || isAppLoading || isProcessingFiles || logic.isEnhancing || !hasInput || !hasApiKey;
  
  // Submit button styling
  let submitButtonClasses = `
    flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center 
    transition-all duration-300 ease-out shadow-sm
  `;
  
  if (isLoading) {
    submitButtonClasses += ` bg-white dark:bg-layer-2 text-primary-main border-2 border-primary-main/20 hover:border-red-500/30 hover:text-red-500`;
  } else if (!isSendDisabled) {
    submitButtonClasses += ` bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5`;
  } else {
    submitButtonClasses += ` bg-layer-2 text-content-tertiary cursor-not-allowed opacity-60`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 pb-2 md:pb-4">
      <form onSubmit={logic.handleSubmit} className="relative group">
        
        {/* Animated Glow Effect - Visible on focus/hover */}
        <div 
            className={`
                absolute -inset-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 
                rounded-[26px] blur-md opacity-0 transition duration-500
                ${logic.isFocused ? 'opacity-40' : 'group-hover:opacity-20'}
            `} 
        />

        <motion.div 
            className={`
              relative flex flex-col p-2 md:p-3 rounded-[24px] transition-all duration-300
              bg-white/80 dark:bg-layer-1/80 backdrop-blur-xl border border-white/40 dark:border-white/10
              shadow-2xl ring-1 ring-black/5 dark:ring-white/5
            `}
            layout
        >
            {/* Top Section: Suggestions & Files */}
            <AnimatePresence>
                {logic.proactiveSuggestions.length > 0 && (
                    <motion.div className="px-2 pt-2 pb-1">
                        <ProactiveAssistance suggestions={logic.proactiveSuggestions} onSuggestionClick={logic.handleSuggestionClick} />
                    </motion.div>
                )}
                {logic.processedFiles.length > 0 && (
                    <motion.div 
                        layout 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="px-3 pt-3 flex flex-col gap-2"
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
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            {/* Main Input Row */}
            <div className="flex items-end gap-2 md:gap-3 p-1">
                
                {/* Attachment Menu */}
                <div className="relative pb-1.5 md:pb-2">
                    <motion.button 
                        ref={logic.attachButtonRef} 
                        type="button" 
                        onClick={() => logic.setIsUploadMenuOpen(p => !p)} 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-content-secondary hover:bg-layer-2 hover:text-primary-main transition-colors disabled:opacity-50"
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-6 md:h-6"><path d="M12 5v14M5 12h14"/></svg>
                    </motion.button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>

                {/* Text Input */}
                <div className="relative flex-grow min-h-[44px] md:min-h-[50px]">
                    <AnimatePresence mode="popLayout">
                        {!hasInput && !logic.isFocused && (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0 } }}
                                className="absolute inset-0 py-3 md:py-3.5 px-2 text-content-tertiary pointer-events-none select-none truncate text-base md:text-[16px] font-medium"
                            >
                                <TextType text={logic.placeholder} loop={true} typingSpeed={65} deletingSpeed={50} pauseDuration={2000} showCursor={false} />
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
                        rows={1}
                        disabled={!hasApiKey}
                        // Set 16px font size on mobile to prevent iOS zoom
                        className="w-full py-3 md:py-3.5 px-2 bg-transparent text-content-primary placeholder-transparent focus:outline-none resize-none max-h-[200px] leading-relaxed text-[16px] md:text-[16px]"
                        style={{ minHeight: '44px' }}
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 pb-1 md:pb-1.5">
                    {/* Voice / Enhance */}
                    <AnimatePresence>
                        {!hasInput && logic.isSupported && (
                            <motion.button 
                                initial={{ scale: 0, width: 0 }} animate={{ scale: 1, width: 'auto' }} exit={{ scale: 0, width: 0 }}
                                type="button" onClick={logic.handleMicClick} disabled={isLoading}
                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${logic.isRecording ? 'bg-status-error-bg text-status-error-text animate-pulse' : 'text-content-secondary hover:bg-layer-2 hover:text-content-primary'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg>
                            </motion.button>
                        )}
                        {hasInput && logic.inputValue.trim().length > 0 && (
                             <motion.button 
                                initial={{ scale: 0, width: 0 }} animate={{ scale: 1, width: 'auto' }} exit={{ scale: 0, width: 0 }}
                                type="button" onClick={logic.handleEnhancePrompt} disabled={logic.isEnhancing}
                                className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-primary-main hover:bg-primary-subtle transition-all"
                                title="Enhance prompt"
                            >
                                {logic.isEnhancing ? (
                                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.394a.75.75 0 010 1.422l-1.183.394c-.447.15-.799.5-.948.948l-.394 1.183a.75.75 0 01-1.422 0l-.394-1.183a1.5 1.5 0 00-.948-.948l-1.183-.394a.75.75 0 010-1.422l1.183-.394c.447-.15.799-.5.948-.948l.394-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" /></svg>
                                )}
                             </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        type={isLoading ? 'button' : 'submit'}
                        onClick={isLoading ? onCancel : undefined}
                        disabled={isLoading ? false : isSendDisabled}
                        className={submitButtonClasses}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        {isLoading ? (
                            <div className="w-3 h-3 bg-current rounded-sm animate-spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 translate-x-0.5 translate-y-px"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                        )}
                    </motion.button>
                </div>
            </div>
            
            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-3 md:px-4 pb-1 pt-1">
                 <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode}
                    disabled={isLoading || isAppLoading || isBackendOffline}
                />
                
                <span className="text-[10px] text-content-tertiary font-medium">
                    AI can make mistakes.
                </span>
            </div>
        </motion.div>
      </form>
    </div>
  );
});
