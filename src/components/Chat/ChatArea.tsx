/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageList, type MessageListHandle } from './MessageList';
import { MessageForm, type MessageFormHandle } from './MessageForm';
import type { Message } from '../../../types';
import { PinnedMessagesBar } from './PinnedMessagesBar';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  modelsLoading: boolean;
  onCancel: () => void;
  ttsVoice: string;
  isAutoPlayEnabled: boolean;
  currentChatId: string | null;
  onTogglePin: (chatId: string, messageId: string) => void;
  onShowThinkingProcess: (messageId: string) => void;
  approveExecution: () => void;
  denyExecution: () => void;
};

export const ChatArea = ({ 
    messages, isLoading, sendMessage, modelsLoading, onCancel, 
    ttsVoice, isAutoPlayEnabled, currentChatId, onTogglePin, 
    onShowThinkingProcess, approveExecution, denyExecution 
}: ChatAreaProps) => {
  const messageFormRef = useRef<MessageFormHandle>(null);
  const messageListRef = useRef<MessageListHandle>(null);
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

  return (
    <div 
      className="flex-1 flex flex-col pb-4 min-h-0 relative"
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
            className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-2xl z-10 flex items-center justify-center m-4"
          >
            <div className="text-center font-bold text-blue-600 dark:text-blue-300">
              <p className="text-lg">Drop files to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PinnedMessagesBar 
          messages={messages}
          currentChatId={currentChatId}
          onUnpin={(messageId) => {
              if (currentChatId) {
                  onTogglePin(currentChatId, messageId);
              }
          }}
      />
      <MessageList
          ref={messageListRef}
          messages={messages} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
          ttsVoice={ttsVoice} 
          isAutoPlayEnabled={isAutoPlayEnabled}
          currentChatId={currentChatId}
          onTogglePin={onTogglePin}
          onShowThinkingProcess={onShowThinkingProcess}
          onScrolledUpChange={setIsScrolledUp}
          approveExecution={approveExecution}
          denyExecution={denyExecution}
          messageFormRef={messageFormRef}
      />
      <AnimatePresence>
        {isScrolledUp && (
          <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => messageListRef.current?.scrollToBottom()}
              className="absolute bottom-28 right-1/2 translate-x-1/2 z-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-white/10 px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100/90 dark:hover:bg-black/80"
              aria-label="Scroll to latest message"
          >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8 12.25a.75.75 0 0 1-.53-.22l-4.25-4.25a.75.75 0 1 1 1.06-1.06L8 10.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-.53.22Z" clipRule="evenodd" />
              </svg>
              <span>Scroll to latest</span>
          </motion.button>
        )}
      </AnimatePresence>
      <div className="flex-shrink-0 pt-4 px-4 sm:px-6 md:px-8">
        <div className="relative w-full max-w-3xl mx-auto">
          <MessageForm 
            ref={messageFormRef}
            onSubmit={sendMessage} 
            isLoading={isLoading || modelsLoading} 
            onCancel={onCancel}
          />
          <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-2 px-4">
              Gemini can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};