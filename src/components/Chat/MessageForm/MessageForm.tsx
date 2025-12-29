
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessageForm, FormattingType } from './useMessageForm';
import { AttachedFilePreview } from './AttachedFilePreview';
import { UploadMenu } from './UploadMenu';
import { VoiceVisualizer } from '../../UI/VoiceVisualizer';
import { ModeToggle } from '../../UI/ModeToggle';
import { MessageFormHandle } from './types';
import { Message } from '../../../types';
import { TextType } from '../../UI/TextType';

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

// Icons for formatting toolbar
const Icons = {
    Bold: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>,
    Italic: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>,
    Strike: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.3 19.2C15.9 20.3 14 21 12 21c-4.4 0-8-3.6-8-8 0-1.2.3-2.3.8-3.3"></path><path d="M19.7 15.3C20.5 14.3 21 13 21 11.5c0-2.8-2.2-5-5-5-1.7 0-3.2.8-4.1 2"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>,
    Code: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
    Bullet: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
    Number: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>,
    Format: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
};

const FormattingButton = ({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) => (
    <button
        type="button"
        onClick={onClick}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
        title={title}
    >
        {icon}
    </button>
);

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

  const [showFormatting, setShowFormatting] = useState(false);

  const isGeneratingResponse = isLoading;
  const isSendDisabled = !logic.canSubmit || isAppLoading || backendStatus === 'offline';

  const formatButtons: { type: FormattingType, icon: React.ReactNode, title: string }[] = [
      { type: 'bold', icon: <Icons.Bold />, title: "Bold (Ctrl+B)" },
      { type: 'italic', icon: <Icons.Italic />, title: "Italic (Ctrl+I)" },
      { type: 'strike', icon: <Icons.Strike />, title: "Strikethrough" },
      { type: 'code', icon: <Icons.Code />, title: "Code Block" },
      { type: 'bullet', icon: <Icons.Bullet />, title: "Bullet List" },
      { type: 'number', icon: <Icons.Number />, title: "Numbered List" },
  ];

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
        relative bg-transparent border transition-all duration-200 rounded-2xl overflow-hidden shadow-sm flex flex-col
        ${logic.isFocused ? 'border-primary-main shadow-md ring-1 ring-primary-main/20' : 'border-border-default hover:border-border-strong'}
      `}>
        {/* Formatting Toolbar */}
        <AnimatePresence>
            {showFormatting && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]"
                >
                    <div className="flex items-center gap-1 p-1.5 px-3">
                        {formatButtons.map((btn) => (
                            <FormattingButton 
                                key={btn.type} 
                                onClick={() => logic.handleFormatting(btn.type)} 
                                icon={btn.icon} 
                                title={btn.title} 
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* File Previews */}
        <AnimatePresence>
          {logic.processedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-3 flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar"
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
        <div className="flex flex-col relative flex-1">
            {/* Animated Placeholder Overlay */}
            {!logic.inputValue && (
               <div className="absolute inset-0 px-4 py-4 pointer-events-none select-none opacity-50 z-0 overflow-hidden">
                  <TextType 
                    text={logic.placeholder} 
                    className="text-content-tertiary text-base leading-relaxed"
                    loop 
                    cursorCharacter="|"
                    typingSpeed={30}
                    deletingSpeed={15}
                    pauseDuration={4000}
                  />
               </div>
            )}
            
            <textarea
                ref={logic.inputRef}
                value={logic.inputValue}
                onChange={(e) => logic.setInputValue(e.target.value)}
                onKeyDown={logic.handleKeyDown}
                onPaste={logic.handlePaste}
                onFocus={() => logic.setIsFocused(true)}
                onBlur={() => logic.setIsFocused(false)}
                disabled={isGeneratingResponse}
                rows={1}
                className="w-full bg-transparent text-content-primary px-4 py-4 max-h-[300px] focus:outline-none resize-none overflow-y-auto leading-relaxed custom-scrollbar placeholder:text-transparent z-10"
                style={{ minHeight: '3.5rem' }}
            />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-3 relative z-10 bg-transparent">
            <div className="flex items-center gap-1">
                {/* Upload Button */}
                <button
                    ref={logic.attachButtonRef}
                    onClick={() => logic.setIsUploadMenuOpen(!logic.isUploadMenuOpen)}
                    disabled={isGeneratingResponse}
                    className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-layer-3 transition-colors disabled:opacity-50"
                    aria-label="Attach files"
                    title="Attach files"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>

                {/* Formatting Toggle */}
                <button
                    onClick={() => setShowFormatting(!showFormatting)}
                    disabled={isGeneratingResponse}
                    className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${showFormatting ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-content-secondary hover:text-content-primary hover:bg-layer-3'}`}
                    aria-label="Formatting options"
                    title="Formatting options"
                >
                    <Icons.Format />
                </button>

                {/* Agent Mode Toggle */}
                <ModeToggle 
                    isAgentMode={isAgentMode} 
                    onToggle={setIsAgentMode} 
                    disabled={isGeneratingResponse} 
                />
            </div>

            <div className="flex items-center gap-2">
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
                    title="Voice input"
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
                            ? 'bg-layer-1 border-2 border-status-error-text/30 hover:bg-status-error-bg hover:border-status-error-text' 
                            : isSendDisabled 
                                ? 'bg-layer-3 text-content-tertiary cursor-not-allowed shadow-none' 
                                : 'bg-primary-main text-text-inverted hover:bg-primary-hover hover:scale-105 hover:shadow-md'
                        }
                    `}
                    whileTap={{ scale: 0.95 }}
                >
                    {isGeneratingResponse ? ( 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                            <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="80 100" strokeDashoffset="0" className={isGeneratingResponse ? 'text-status-error-text' : 'text-primary-main'}>
                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="2.5s" repeatCount="indefinite" />
                                <animate attributeName="stroke-dashoffset" values="0; -180" dur="2.5s" repeatCount="indefinite" />
                                <animate attributeName="stroke" dur="10s" repeatCount="indefinite" values="#f87171; #fb923c; #facc15; #4ade80; #22d3ee; #3b82f6; #818cf8; #e879f9; #f472b6; #f87171" />
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
      </div>

      {/* Footer Info */}
      <div className="flex justify-center items-center pt-3 pb-0">
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[11px] font-medium text-content-tertiary/70 select-none"
          >
             Agentic AI can make mistakes.
          </motion.p>
      </div>
    </div>
  );
});
