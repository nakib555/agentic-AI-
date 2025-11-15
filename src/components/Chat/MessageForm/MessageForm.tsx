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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center">
      <div className="relative w-full max-w-4xl px-4 sm:px-6 md:px-8 pb-4">
        <motion.form 
            className="glass-morphic flex flex-col p-2" 
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
            
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.rtf,.log,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <input type="file" ref={logic.folderInputRef} onChange={logic.handleFileChange} className="hidden" aria-hidden="true" {...{ webkitdirectory: "", directory: "" }} multiple />
            
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1">
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
              </div>

              <div ref={logic.inputRef} contentEditable={!logic.isEnhancing} onInput={(e) => logic.setInputValue(e.currentTarget.innerText)} onKeyDown={logic.handleKeyDown} onPaste={logic.handlePaste} aria-label="Chat input" role="textbox" data-placeholder={logic.isRecording ? 'Listening...' : (isLoading ? "Generating response..." : "Ask anything, or drop a file")} className="content-editable-input w-full px-2 py-1.5 bg-transparent text-gray-900 dark:text-slate-200 focus:outline-none flex-1" style={{ minHeight: '32px', maxHeight: '192px', transition: 'height 0.2s ease-in-out' }} />
              
              <div className="flex items-center gap-1">
                <AnimatePresence>
                  {logic.isSupported && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={logic.handleMicClick} disabled={isLoading || logic.isEnhancing} aria-label={logic.isRecording ? 'Stop recording' : 'Start recording'} title={logic.isRecording ? 'Stop recording' : 'Start recording'} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${logic.isRecording ? 'bg-red-500/20 !text-red-500' : ''}`}>
                          {logic.isRecording ? ( <motion.div initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 12.5v-9Z" /></svg></motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" /></svg> )}
                      </motion.button>
                  )}
                </AnimatePresence>
                  
                <button type={isLoading ? 'button' : 'submit'} onClick={isLoading ? onCancel : undefined} disabled={!isLoading && (!hasInput || logic.isEnhancing || isProcessingFiles)} aria-label={isLoading ? "Stop generating" : "Send message"} title={isLoading ? "Stop generating" : (isProcessingFiles ? "Processing files..." : "Send message")} 
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out transform disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLoading ? 'bg-red-600 text-white shadow-md hover:bg-red-500 active:scale-90' :
                    (hasInput && !isProcessingFiles) ? 'brand-gradient text-white shadow-lg hover:shadow-xl active:scale-90' :
                    'bg-gray-200 dark:bg-black/20 text-gray-400 dark:text-slate-500 scale-90'
                    }`}
                >
                    {isLoading ? ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.27a.75.75 0 0 1 .92-.592l12.5 3.25a.75.75 0 0 1 0 1.344l-12.5 3.25a.75.75 0 0 1-.92-.592V3.27Z" /><path d="M3.105 10.77a.75.75 0 0 1 .92-.592l12.5 3.25a.75.75 0 0 1 0 1.344l-12.5 3.25a.75.75 0 0 1-.92-.592v-6.5Z" /></svg> )}
                </button>
              </div>
            </div>
            {logic.isExpanded && (
                <motion.div layout className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200/50 dark:border-white/10">
                    <ModeToggle 
                        isAgentMode={isAgentMode} 
                        onToggle={setIsAgentMode}
                        disabled={isLoading}
                    />
                    {/* Placeholder for future buttons */}
                </motion.div>
            )}
        </motion.form>
      </div>
    </div>
  );
});