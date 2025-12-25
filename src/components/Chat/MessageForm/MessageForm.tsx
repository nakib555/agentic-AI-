
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessageForm } from './useMessageForm';
import { useTokenCounter } from './useTokenCounter';
import { AttachedFilePreview } from './AttachedFilePreview';
import { UploadMenu } from './UploadMenu';
import { VoiceVisualizer } from '../../UI/VoiceVisualizer';
import { ModeToggle } from '../../UI/ModeToggle';
import { MessageFormHandle } from './types';
import { Message } from '../../../types';

type MessageFormProps = {
  onSubmit: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
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
  currentChatId: string | null;
  activeModel: string;
};

export const MessageForm = forwardRef<MessageFormHandle, MessageFormProps>((props, ref) => {
  const { 
    onSubmit, isLoading, isAppLoading, backendStatus, onCancel, 
    isAgentMode, setIsAgentMode, messages, hasApiKey, 
    currentChatId, activeModel 
  } = props;

  const logic = useMessageForm(
    (msg, files, options) => onSubmit(msg, files, { ...options, isThinkingModeEnabled: isAgentMode }),
    isLoading,
    ref,
    messages,
    isAgentMode,
    hasApiKey
  );

  const { formattedCount, isCounting } = useTokenCounter(
    logic.inputValue,
    logic.processedFiles,
    isAgentMode,
    activeModel,
    currentChatId,
    hasApiKey,
    messages.length
  );

  const isGeneratingResponse = isLoading;
  const isSendDisabled = !logic.canSubmit || isAppLoading || backendStatus === 'offline';

  return (
    <div className="w-full mx-auto max-w-4xl relative">
      <VoiceVisualizer isRecording={logic.isRecording} />

      <AnimatePresence>
        {logic.isUploadMenuOpen && (
          <UploadMenu 
            menuRef={logic.uploadMenuRef}
            onFileClick={() => logic.fileInputRef.current?.click()}
            onFolderClick={() => logic.folderInputRef.current?.click()}
          />
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={logic.fileInputRef}
        onChange={logic.handleFileChange}
        className="hidden"
        multiple
      />
      <input
        type="file"
        ref={logic.folderInputRef}
        onChange={logic.handleFileChange}
        className="hidden"
        multiple
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      <div className={`
        relative bg-layer-2 border transition-all duration-200 rounded-3xl overflow-hidden shadow-sm
        ${logic.isFocused ? 'border-primary-main shadow-md ring-1 ring-primary-main/20' : 'border-border-default hover:border-border-strong'}
      `}>
        {/* File Previews */}
        <AnimatePresence>
          {logic.processedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-3 flex flex-col gap-2"
            >
              {logic.processedFiles.map(file => (
                <AttachedFilePreview
                  key={file.id}
                  file={file.file}
                  onRemove={() => logic.handleRemoveFile(file.id)}
                  progress={file.progress}
                  error={file.error}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Input */}
        <div className="flex flex-col relative">
            <textarea
                ref={logic.inputRef}
                value={logic.inputValue}
                onChange={(e) => logic.setInputValue(e.target.value)}
                onKeyDown={logic.handleKeyDown}
                onPaste={logic.handlePaste}
                onFocus={() => logic.setIsFocused(true)}
                onBlur={() => logic.setIsFocused(false)}
                placeholder={logic.placeholder[1]} // Use current placeholder
                disabled={isGeneratingResponse}
                rows={1}
                className="w-full bg-transparent text-content-primary px-4 py-4 max-h-[200px] focus:outline-none resize-none overflow-y-auto leading-relaxed custom-scrollbar placeholder:text-content-tertiary"
                style={{ minHeight: '3.5rem' }}
            />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-3">
            <div className="flex items-center gap-1">
                {/* Upload Button */}
                <button
                    ref={logic.attachButtonRef}
                    onClick={() => logic.setIsUploadMenuOpen(!logic.isUploadMenuOpen)}
                    disabled={isGeneratingResponse}
                    className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-layer-3 transition-colors disabled:opacity-50"
                    aria-label="Attach files"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>

                {/* Agent Mode Toggle */}
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode} 
                    disabled={isGeneratingResponse} 
                />
            </div>

            <div className="flex items-center gap-2">
                {/* Token Counter */}
                {(formattedCount || isCounting) && (
                    <div className="text-xs font-mono text-content-tertiary px-2 select-none">
                        {isCounting ? '...' : `${formattedCount} tok`}
                    </div>
                )}

                {/* Voice Input */}
                <button
                    onClick={logic.handleMicClick}
                    disabled={isGeneratingResponse || !logic.isSupported}
                    className={`
                        p-2 rounded-xl transition-colors disabled:opacity-50
                        ${logic.isRecording 
                            ? 'bg-red-500/10 text-red-500 animate-pulse' 
                            : 'text-content-secondary hover:text-content-primary hover:bg-layer-3'
                        }
                    `}
                    aria-label="Voice input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                </button>

                {/* Prompt Enhancer */}
                <button
                    onClick={logic.handleEnhancePrompt}
                    disabled={isGeneratingResponse || !logic.inputValue.trim() || logic.isEnhancing}
                    className={`
                        p-2 rounded-xl transition-all duration-300 disabled:opacity-50
                        ${logic.isEnhancing 
                            ? 'text-primary-main bg-primary-subtle' 
                            : 'text-content-secondary hover:text-primary-main hover:bg-layer-3'
                        }
                    `}
                    aria-label="Enhance prompt"
                    title="Enhance prompt with AI"
                >
                    {logic.isEnhancing ? (
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            <path d="M5 3v4" />
                            <path d="M9 5H3" />
                            <path d="M20 21h-4" />
                            <path d="M18 19v4" />
                        </svg>
                    )}
                </button>

                {/* Send Button */}
                <motion.button
                    type="button"
                    onClick={isGeneratingResponse ? onCancel : logic.handleSubmit}
                    disabled={!isGeneratingResponse && isSendDisabled}
                    aria-label={isGeneratingResponse ? "Stop generating" : "Send message"}
                    className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                        ${isGeneratingResponse 
                            ? 'bg-layer-1 border-2 border-status-error-text text-status-error-text hover:bg-status-error-bg' 
                            : isSendDisabled 
                                ? 'bg-layer-3 text-content-tertiary cursor-not-allowed shadow-none' 
                                : 'bg-primary-main text-text-inverted hover:bg-primary-hover hover:scale-105 hover:shadow-md'
                        }
                    `}
                    whileTap={{ scale: 0.95 }}
                >
                    {isGeneratingResponse ? ( 
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <rect width="24" height="24" rx="4" />
                        </svg>
                    ) : ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                     )}
                </motion.button>
            </div>
        </div>
      </div>
    </div>
  );
});
