
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
  
  const sendButtonClasses = "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out shadow-sm";

  // Determine button color and state
  let sendButtonStateClasses = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-slate-600 cursor-not-allowed'; // Default disabled
  if (isGeneratingResponse) {
    sendButtonStateClasses = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-red-500/50 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md'; // Stop state
  } else if (!isSendDisabled) {
    sendButtonStateClasses = 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20 shadow-md transform hover:-translate-y-0.5'; // Active state
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={logic.handleSubmit} className="relative">
        <motion.div 
            className={`
              relative flex flex-col p-3 rounded-[1.5rem] transition-shadow duration-300
              ${logic.isFocused 
                ? 'bg-white dark:bg-[#1a1a1a] shadow-xl ring-1 ring-black/5 dark:ring-white/10' 
                : 'bg-gray-50/80 dark:bg-[#121212] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md'
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
              <AnimatePresence>
                {!hasInput && !logic.isFocused && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 py-3.5 text-gray-400 dark:text-slate-500 pointer-events-none select-none truncate font-medium"
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
                disabled={logic.isEnhancing || isAppLoading || isBackendOffline}
                value={logic.inputValue}
                onChange={(e) => logic.setInputValue(e.target.value)}
                onKeyDown={logic.handleKeyDown}
                onPaste={logic.handlePaste}
                onFocus={() => logic.setIsFocused(true)}
                onBlur={() => logic.setIsFocused(false)}
                aria-label="Chat input"
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
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path clipRule="evenodd" d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5H3.75a.75.75 0 010-1.5h5.5V3.75A.75.75 0 0110 3z" /></svg>
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
                        disabled={isLoading || logic.isEnhancing || isAppLoading || isBackendOffline} 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${logic.isRecording ? 'bg-red-50 text-red-500 dark:bg-red-500/20' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                        whileTap={{ scale: 0.9 }}
                        title={logic.isRecording ? "Stop recording" : "Voice input"}
                      >
                          {logic.isRecording ? ( 
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }} 
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" /></svg>
                            </motion.div> 
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
                        initial={{ opacity: 0, scale: 0.8, width: 0 }} 
                        animate={{ opacity: 1, scale: 1, width: 'auto' }} 
                        exit={{ opacity: 0, scale: 0.8, width: 0 }} 
                        type="button" 
                        onClick={logic.handleEnhancePrompt} 
                        disabled={logic.isEnhancing || isAppLoading || isBackendOffline} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                        title="Enhance prompt with AI"
                        whileTap={{ scale: 0.9 }}
                    >
                      {logic.isEnhancing ? ( 
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                        </motion.div> 
                      ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.394a.75.75 0 010 1.422l-1.183.394c-.447.15-.799.5-.948.948l-.394 1.183a.75.75 0 01-1.422 0l-.394-1.183a1.5 1.5 0 00-.948-.948l-1.183-.394a.75.75 0 010-1.422l1.183-.394c.447-.15.799-.5.948-.948l.394-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" /></svg> 
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
                        isBackendOffline ? "Server not connected" :
                        isAppLoading ? "Initializing..." :
                        isProcessingFiles ? "Processing files..." :
                        isGeneratingResponse ? "Stop generating" :
                        "Send message"
                    }
                    className={`${sendButtonClasses} ${sendButtonStateClasses}`}
                    whileTap={{ scale: 0.95 }}
                >
                    {isGeneratingResponse ? ( 
                       <div className="w-6 h-6">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                           <rect 
                             x="18" y="18" 
                             width="12" height="12" 
                             rx="2" ry="2"
                             fill="currentColor"
                           />
                           <circle 
                             cx="24" cy="24" r="16" 
                             fill="none" 
                             strokeWidth="4.5" 
                             strokeLinecap="round"
                             strokeDasharray="80 100" 
                             strokeDashoffset="0">
                             <animateTransform 
                               attributeName="transform" 
                               type="rotate" 
                               from="0 24 24" 
                               to="360 24 24" 
                               dur="2.5s" 
                               repeatCount="indefinite"/>
                             <animate 
                               attributeName="stroke-dashoffset" 
                               values="0; -180" 
                               dur="2.5s" 
                               repeatCount="indefinite"/>
                             <animate 
                               attributeName="stroke" 
                               dur="10s" 
                               repeatCount="indefinite"
                               values="#f87171;#fb923c;#facc15;#4ade80;#22d3ee;#3b82f6;#818cf8;#e879f9;#f472b6;#f87171"
                             />
                           </circle>
                         </svg>
                       </div>
                    ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 translate-x-0.5 translate-y-px">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
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
