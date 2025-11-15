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

export const MessageForm = forwardRef<MessageFormHandle, {
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void;
  isLoading: boolean;
  onCancel: () => void;
  isAgentMode: boolean;
  setIsAgentMode: (isAgent: boolean) => void;
}>(({ onSubmit, isLoading, onCancel, isAgentMode, setIsAgentMode }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref);
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.trim().length > 0 || logic.processedFiles.length > 0;
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  const sendButtonClasses = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ease-in-out";
  const isSendButtonActive = hasInput && !isLoading && !logic.isEnhancing && !isProcessingFiles;
  const sendButtonStateClasses = isLoading 
    ? 'bg-red-600 text-white shadow-md hover:bg-red-500 active:scale-90'
    : (isSendButtonActive
        ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-500 active:scale-90'
        : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400');

  return (
    <div className="flex flex-col">
        <motion.form 
            className="bg-slate-100 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-700/50 flex flex-col" 
            onSubmit={logic.handleSubmit}
        >
            <div className="w-full">
              <AnimatePresence>
                  {logic.proactiveSuggestions.length > 0 && (
                      <ProactiveAssistance suggestions={logic.proactiveSuggestions} onSuggestionClick={logic.handleSuggestionClick} />
                  )}
              </AnimatePresence>
              <AnimatePresence>
              {logic.processedFiles.length > 0 && (
                  <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="p-2 pt-0 flex flex-col gap-2">
                  {logic.processedFiles.map((pf) => (
                      <motion.div key={pf.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <AttachedFilePreview file={pf.file} onRemove={() => logic.handleRemoveFile(pf.id)} progress={pf.progress} error={pf.error} />
                      </motion.div>
                  ))}
                  </motion.div>
              )}
              </AnimatePresence>
            </div>
            
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            <div className="flex items-end p-2 gap-2 bg-slate-100 dark:bg-transparent">
              <div className="flex items-center gap-1 self-end mb-1">
                <div className="relative">
                    <button ref={logic.attachButtonRef} type="button" onClick={() => logic.setIsUploadMenuOpen(p => !p)} aria-label="Attach files or folder" title="Attach files or folder" disabled={logic.isEnhancing} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                    </button>
                    <AnimatePresence>
                        {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                    </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {logic.isSupported && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleMicClick} disabled={isLoading || logic.isEnhancing} aria-label={logic.isRecording ? 'Stop recording' : 'Start recording'} title={logic.isRecording ? 'Stop recording' : 'Start recording'} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${logic.isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}>
                          {logic.isRecording ? ( <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg> )}
                      </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex-grow flex items-end p-2 bg-white dark:bg-zinc-800/50 border border-slate-300 dark:border-zinc-700 rounded-xl">
                <div ref={logic.inputRef} contentEditable={!logic.isEnhancing} onInput={(e) => logic.setInputValue(e.currentTarget.innerText)} onKeyDown={logic.handleKeyDown} onPaste={logic.handlePaste} aria-label="Chat input" role="textbox" data-placeholder={logic.isRecording ? 'Listening...' : (isLoading ? "Generating response..." : "Ask anything, or drop a file")} className={`content-editable-input w-full bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none ${logic.isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ minHeight: '24px', maxHeight: '192px', transition: 'height 0.2s ease-in-out' }} />
                
                <div className="flex items-center gap-1 flex-shrink-0 self-end ml-2">
                  <AnimatePresence>
                    {hasText && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleEnhancePrompt} disabled={logic.isEnhancing} aria-label="Enhance prompt" title="Enhance prompt" className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                        {logic.isEnhancing ? ( <motion.div className="w-4 h-4" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 00-3.375-3.375H8.25a3.375 3.375 0 00-3.375 3.375v2.25" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.422 2.22a.75.75 0 0 1 .862.053l4.25 3.5a.75.75 0 0 1-.053 1.328L10.5 8.165l2.121 2.122a.75.75 0 0 1-1.06 1.06L9.44 9.227a.75.75 0 0 1 0-1.06l4.25-4.25-1.928-1.593a.75.75 0 0 1 .66-1.328ZM3.79 8.29a.75.75 0 0 1 0 1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L5.81 15.5l-2.12-2.121a.75.75 0 0 1 1.06-1.06l2.12 2.121L3.79 8.29Z" clipRule="evenodd" /><path d="m11.5 5.5.034-.034a.75.75 0 0 1 1.028.034l3.5 4.25a.75.75 0 0 1-1.114.996L12.5 7.695V14.5a.75.75 0 0 1-1.5 0V5.5Z" /></svg> )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                  
                  <button type={isLoading ? 'button' : 'submit'} onClick={isLoading ? onCancel : undefined} disabled={!isLoading && (!hasInput || logic.isEnhancing || isProcessingFiles)} aria-label={isLoading ? "Stop generating" : "Send message"} title={isLoading ? "Stop generating" : (isProcessingFiles ? "Processing files..." : "Send message")} className={`${sendButtonClasses} ${sendButtonStateClasses}`}>
                      {isLoading ? ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .95.53l4.949-1.414a.75.75 0 0 0 .53-.95L8.222 3.105a.75.75 0 0 0-.95-.53L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.53.95l4.949 1.414a.75.75 0 0 0 .95-.53L3.105 2.289Z" /></svg> )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end mb-1">
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode}
                    disabled={isLoading}
                />
              </div>

            </div>
        </motion.form>
        <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-2 px-4">
            Gemini can make mistakes. Check important info.
        </p>
    </div>
  );
});