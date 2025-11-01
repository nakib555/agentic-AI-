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

export const MessageForm = forwardRef<MessageFormHandle, {
  onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void;
  isLoading: boolean;
  onCancel: () => void;
}>(({ onSubmit, isLoading, onCancel }, ref) => {
  const logic = useMessageForm(onSubmit, isLoading, ref);
  
  const isProcessingFiles = logic.processedFiles.some(f => f.progress < 100 && !f.error);
  const hasInput = logic.inputValue.trim().length > 0 || logic.processedFiles.length > 0;
  const hasText = logic.inputValue.trim().length > 0 && logic.processedFiles.length === 0;

  const sendButtonClasses = "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out";
  const sendButtonStateClasses = (hasInput && !isLoading && !logic.isEnhancing && !isProcessingFiles)
    ? 'bg-gray-400 dark:bg-slate-200 text-gray-800 dark:text-black'
    : 'bg-gray-600 dark:bg-[#202123] text-gray-400 dark:text-slate-500';

  return (
    <motion.form 
        className={`bg-gray-200/50 dark:bg-[#202123] border border-gray-300 dark:border-white/10 flex flex-col p-2`} 
        onSubmit={logic.handleSubmit}
        animate={{ borderRadius: logic.isExpanded ? '1rem' : '1.5rem' }}
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
        
        <div className="flex items-end gap-2">
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            <div className="relative">
                <button ref={logic.attachButtonRef} type="button" onClick={() => logic.setIsUploadMenuOpen(p => !p)} aria-label="Attach files or folder" title="Attach files or folder" disabled={isLoading || logic.isEnhancing} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                    <svg viewBox="0 0 50 50" fill="currentColor" className="w-5 h-5"><circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" strokeWidth="1.5" /><line x1="25" y1="14" x2="25" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><line x1="14" y1="25" x2="36" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                </button>
                <AnimatePresence>
                    {logic.isUploadMenuOpen && ( <UploadMenu menuRef={logic.uploadMenuRef} onFileClick={() => { logic.fileInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} onFolderClick={() => { logic.folderInputRef.current?.click(); logic.setIsUploadMenuOpen(false); }} /> )}
                </AnimatePresence>
            </div>
            <div className="relative flex-grow">
              <div ref={logic.inputRef} contentEditable={!isLoading && !logic.isEnhancing} onInput={(e) => logic.setInputValue(e.currentTarget.innerText)} onKeyDown={logic.handleKeyDown} onPaste={logic.handlePaste} aria-label="Chat input" role="textbox" data-placeholder={logic.isRecording ? 'Listening...' : "Ask anything, or drop a file"} className={`content-editable-input w-full bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none ${isLoading || logic.isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ minHeight: '28px', maxHeight: '192px', transition: 'height 0.2s ease-in-out' }} />
            </div>
            <AnimatePresence>
            {logic.isSupported && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleMicClick} disabled={isLoading || logic.isEnhancing} aria-label={logic.isRecording ? 'Stop recording' : 'Start recording'} title={logic.isRecording ? 'Stop recording' : 'Start recording'} className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${logic.isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}>
                    {logic.isRecording ? ( <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg> )}
                </motion.button>
            )}
            </AnimatePresence>

            <AnimatePresence>
              {hasText && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleEnhancePrompt} disabled={isLoading || logic.isEnhancing} aria-label="Enhance prompt" title="Enhance prompt" className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                  {logic.isEnhancing ? ( <motion.div className="w-4 h-4" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 00-3.375-3.375H8.25a3.375 3.375 0 00-3.375 3.375v2.25" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.422 2.22a.75.75 0 0 1 .862.053l4.25 3.5a.75.75 0 0 1-.053 1.328L10.5 8.165l2.121 2.122a.75.75 0 0 1-1.06 1.06L9.44 9.227a.75.75 0 0 1 0-1.06l4.25-4.25-1.928-1.593a.75.75 0 0 1 .66-1.328ZM3.79 8.29a.75.75 0 0 1 0 1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L5.81 15.5l-2.12-2.121a.75.75 0 0 1 1.06-1.06l2.12 2.121L3.79 8.29Z" clipRule="evenodd" /><path d="m11.5 5.5.034-.034a.75.75 0 0 1 1.028.034l3.5 4.25a.75.75 0 0 1-1.114.996L12.5 7.695V14.5a.75.75 0 0 1-1.5 0V5.5Z" /></svg> )}
                </motion.button>
              )}
            </AnimatePresence>

            <button type="button" onClick={() => logic.setIsThinkingModeEnabled(!logic.isThinkingModeEnabled)} disabled={isLoading || logic.isEnhancing || logic.processedFiles.length > 0} aria-label={logic.isThinkingModeEnabled ? 'Disable thinking mode' : 'Enable thinking mode (text only)'} title={logic.isThinkingModeEnabled ? 'Disable thinking mode for complex reasoning' : 'Enable thinking mode for complex reasoning (text only)'} className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${logic.isThinkingModeEnabled ? 'bg-purple-400/20 !text-purple-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/20'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a5.523 5.523 0 0 0-1.503 1.334c-.792.792-1.247 1.87-1.247 2.985v.253a.75.75 0 0 0 1.5 0v-.253c0-.8.316-1.55.879-2.113a4.023 4.023 0 0 1 2.113-.879H7.75V2.75Z" /><path d="M12.25 2.75a.75.75 0 0 1 1.5 0v1.258a5.523 5.523 0 0 1 1.503 1.334c.792.792 1.247 1.87 1.247 2.985v.253a.75.75 0 0 1-1.5 0v-.253c0-.8-.316-1.55-.879-2.113a4.023 4.023 0 0 0-2.113-.879H12.25V2.75Z" /><path fillRule="evenodd" d="M17 10c0-2.036-1.289-3.796-3.085-4.482A5.526 5.526 0 0 0 10 3.5a5.526 5.526 0 0 0-3.915 1.018C4.289 6.204 3 7.964 3 10c0 2.036 1.289 3.796 3.085 4.482A5.526 5.526 0 0 0 10 16.5a5.526 5.526 0 0 0 3.915-1.018C15.711 13.796 17 12.036 17 10ZM10 5a4.026 4.026 0 0 1 2.848.742A4.49 4.49 0 0 1 15.5 10a4.49 4.49 0 0 1-2.652 4.258A4.026 4.026 0 0 1 10 15a4.026 4.026 0 0 1-2.848-.742A4.49 4.49 0 0 1 4.5 10a4.49 4.49 0 0 1 2.652-4.258A4.026 4.026 0 0 1 10 5Z" clipRule="evenodd" /><path d="M7.75 12.25a.75.75 0 0 0-1.5 0v.253c0 1.114.455 2.193 1.247 2.985a5.523 5.523 0 0 0 1.503 1.334V18a.75.75 0 0 0 1.5 0v-1.178a4.023 4.023 0 0 1-2.113-.879.75.75 0 0 1-.879-2.113V12.25Z" /><path d="M12.25 12.25a.75.75 0 0 1 1.5 0v.253c0 1.114-.455 2.193-1.247 2.985a5.523 5.523 0 0 1-1.503 1.334V18a.75.75 0 0 1-1.5 0v-1.178a4.023 4.023 0 0 0 2.113-.879c.563-.564.879-1.314.879-2.113V12.25Z" /></svg>
            </button>
            
            <button type={isLoading ? 'button' : 'submit'} onClick={isLoading ? onCancel : undefined} disabled={!isLoading && (!hasInput || logic.isEnhancing || isProcessingFiles)} aria-label={isLoading ? "Stop generating" : "Send message"} title={isLoading ? "Stop generating" : (isProcessingFiles ? "Processing files..." : "Send message")} className={`${sendButtonClasses} ${sendButtonStateClasses}`}>
                {isLoading ? ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 -mr-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg> )}
            </button>
        </div>
    </motion.form>
  );
});
