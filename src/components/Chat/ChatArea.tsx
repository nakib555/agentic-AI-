/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { MessageList, type MessageListHandle } from './MessageList';
import type { MessageFormHandle } from './MessageForm/index';
import type { Message } from '../../types';
import { ModeToggle } from '../UI/ModeToggle';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  modelsLoading: boolean;
  onCancel: () => void;
  ttsVoice: string;
  isAutoPlayEnabled: boolean;
  currentChatId: string | null;
  onShowThinkingProcess: (messageId: string) => void;
  approveExecution: (editedPlan: string) => void;
  denyExecution: () => void;
  messageListRef: React.RefObject<MessageListHandle>;
  onRegenerate: (messageId: string) => void;
  onSetActiveResponseIndex: (chatId: string, messageId: string, index: number) => void;
  isAgentMode: boolean;
  setIsAgentMode: (isAgent: boolean) => void;
  backendStatus: 'online' | 'offline' | 'checking';
  backendError: string | null;
  messageFormRef: React.RefObject<MessageFormHandle>;
};

export const ChatArea = ({ 
    messages, isLoading, sendMessage, modelsLoading, onCancel, 
    ttsVoice, isAutoPlayEnabled, currentChatId,
    onShowThinkingProcess, approveExecution, denyExecution,
    messageListRef, onRegenerate, onSetActiveResponseIndex,
    isAgentMode, setIsAgentMode, backendStatus, backendError,
    messageFormRef
}: ChatAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  // Use a counter to robustly handle drag enter/leave events on nested elements.
  const dragCounter = useRef(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    // Only show the overlay if files are being dragged.
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Use the ref to imperatively call the method on MessageForm
      messageFormRef.current?.attachFiles(Array.from(files));
    }
  };

  const handleSetActiveResponseIndex = useCallback((messageId: string, index: number) => {
    if (currentChatId) {
      onSetActiveResponseIndex(currentChatId, messageId, index);
    }
  }, [currentChatId, onSetActiveResponseIndex]);

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 relative"
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 border-2 border-dashed border-indigo-500 dark:border-indigo-400 rounded-2xl z-10 flex items-center justify-center m-4"
          >
            <div className="text-center font-bold text-indigo-600 dark:text-indigo-300">
              <p className="text-lg">Drop files to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MessageList
          ref={messageListRef}
          messages={messages} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
          ttsVoice={ttsVoice} 
          isAutoPlayEnabled={isAutoPlayEnabled}
          currentChatId={currentChatId}
          onShowThinkingProcess={onShowThinkingProcess}
          onScrolledUpChange={setIsScrolledUp}
          approveExecution={approveExecution}
          denyExecution={denyExecution}
          messageFormRef={messageFormRef}
          onRegenerate={onRegenerate}
          onSetActiveResponseIndex={handleSetActiveResponseIndex}
          isAgentMode={isAgentMode}
      />
      <AnimatePresence>
        {isScrolledUp && (
          <div className="absolute bottom-28 inset-x-0 flex justify-center z-10 pointer-events-none">
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => messageListRef.current?.scrollToBottom()}
                className="pointer-events-auto bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-white/10 px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100/90 dark:hover:bg-black/80"
                aria-label="Scroll to latest message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8 12.25a.75.75 0 0 1-.53-.22l-4.25-4.25a.75.75 0 1 1 1.06-1.06L8 10.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-.53.22Z" clipRule="evenodd" />
                </svg>
                <span>Scroll to latest</span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {backendStatus === 'offline' && (
          <motion.div
            className="px-4 sm:px-6 md:px-8 py-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="bg-red-500/10 dark:bg-red-900/20 border border-red-500/20 text-red-700 dark:text-red-300 text-sm rounded-lg p-3 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Connection Error</p>
                <p>{backendError} Retrying automatically...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};