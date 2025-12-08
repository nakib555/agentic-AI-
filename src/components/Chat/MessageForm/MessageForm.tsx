
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
}>(({ onSubmit, isLoading, onCancel, isAppLoading, backendStatus, isAgentMode, setIsAgentMode, messages, hasApiKey }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref, messages, isAgentMode, hasApiKey);
  
  const isBackendChecking = backendStatus === 'checking';
  const isBackendOffline = backendStatus !== 'online';
  // isConnecting variable removed as it was only used for the spinner
  const isGeneratingResponse = isLoading;
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.length > 0 || logic.processedFiles.length > 0; // Check length directly for speed
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  // The button is disabled if the app isn't ready or there's nothing to send.
  // It is NOT disabled when generating, because it becomes a cancel button.
  const isSendDisabled = isBackendOffline || isAppLoading || isProcessingFiles || logic.isEnhancing || !hasInput || !hasApiKey;
  
  const sendButtonClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-sm";

  // Determine button color and state
  let sendButtonStateClasses = 'bg-layer-3 text-text-tertiary cursor-not-allowed'; // Default disabled
  if (isGeneratingResponse) {
    sendButtonStateClasses = 'bg-text-primary text-bg-page hover:scale-105 hover:bg-status-error-text shadow-md'; // Stop state
  } else if (!isSendDisabled) {
    sendButtonStateClasses = 'bg-text-primary text-bg-page hover:bg-primary-main hover:scale-105 shadow-md shadow-primary-main/20'; // Active state
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <form onSubmit={logic.handleSubmit} className="relative group">
        
        {/* Glow effect behind input */}
        <div className={`absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-primary-main/30 to-purple-600/30 blur-xl opacity-0 transition-opacity duration-500 ${logic.isFocused ? 'opacity-70' : 'group-hover:opacity-30'}`} />

        <motion.div 
            className={`
              relative flex flex-col p-2 rounded-[26px] transition-all duration-300 border backdrop-blur-xl shadow-2xl
              ${logic.isFocused 
                ? 'bg-bg-input border-primary-main/30 ring-1 ring-primary-main/20' 
                : 'bg-bg-input/80 border-border-subtle hover:border-border-strong'
              }
            `}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Proactive Assistance */}
            <AnimatePresence>
                {logic.proactiveSuggestions.length > 0 && (
                    <div className="mb-2 px-2 overflow-hidden">
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
                        className="mb-3 flex flex-col gap-3 px-2"
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
            <div className="relative flex-grow min-h-[52px] px-4 flex items-center">
              <AnimatePresence mode="popLayout">
                {!hasInput && !logic.isFocused && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        className="absolute inset-0 py-3.5 px-4 text-text-tertiary pointer-events-none select-none truncate text-[15px] z-0"
                        aria-hidden="true"
                    >
                        <TextType
                            text={logic.placeholder}
                            loop={true}
                            typingSpeed={50}
                            deletingSpeed={30}
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
                className={`w-full bg-transparent text-content-primary focus:outline-none relative z-10 resize-none overflow-hidden leading-relaxed text-[15px] ${logic.isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '24px', maxHeight: '200px' }}
                rows={1}
              />
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-2 pb-1">
              <div className="flex items-center gap-1">
                {/* Attachment Button */}
                <div className="relative">
                    <motion.button 
                        ref={logic.attachButtonRef} 
                        type="button" 
                        onClick={() => logic.setIsUploadMenuOpen(p => !p)} 
                        aria-label="Attach files" 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-layer-2 hover:text-content-primary transition-colors disabled:opacity-50"
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path clipRule="evenodd" d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5H3.75a.75.75 0 010-1.5h5.5V3.75A.75.75 0 0110 3z" /></svg>
                    </motion.button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>
                
                {/* Mode Toggle */}
                <div className="h-4 w-px bg-border-subtle mx-1" />
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode}
                    disabled={isLoading || isAppLoading || isBackendOffline}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Input */}
                <AnimatePresence>
                  {logic.isSupported && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.8 }} 
                        type="button" 
                        onClick={logic.handleMicClick} 
                        disabled={isLoading || logic.isEnhancing || isAppLoading || isBackendOffline || !hasApiKey} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${logic.isRecording ? 'bg-status-error-bg text-status-error-text animate-pulse' : 'text-text-tertiary hover:bg-layer-2 hover:text-content-primary'}`}
                        whileTap={{ scale: 0.9 }}
                        title={logic.isRecording ? "Stop recording" : "Voice input"}
                      >
                          {logic.isRecording ? ( 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" /></svg>
                          ) : ( 
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg> 
                          )}
                      </motion.button>
                  )}
                </AnimatePresence>

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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-primary-main hover:bg-primary-subtle transition-all disabled:opacity-50"
                        title="Enhance prompt with AI"
                        whileTap={{ scale: 0.9 }}
                    >
                      {logic.isEnhancing ? ( 
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                        </motion.div> 
                      ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.394a.75.75 0 010 1.422l-1.183.394c-.447.15-.799.5-.948.948l-.394 1.183a.75.75 0 01-1.422 0l-.394-1.183a1.5 1.5 0 00-.948-.948l-1.183-.394a.75.75 0 010-1.422l1.183-.394c.447-.15.799-.5.948-.948l.394-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" /></svg> 
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

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
                       <div className="w-4 h-4 rounded-sm bg-bg-page" />
                    ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                     )}
                </motion.button>
              </div>
            </div>
        </motion.div>
      </form>
      
      <div className="flex justify-center mt-3">
          <p className="text-[11px] text-text-tertiary font-medium">
             Agentic AI can make mistakes. Verify important information.
          </p>
      </div>
    </div>
  );
});
