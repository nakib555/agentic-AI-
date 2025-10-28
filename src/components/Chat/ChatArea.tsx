/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageList } from './MessageList';
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
};

export const ChatArea = ({ messages, isLoading, sendMessage, modelsLoading, onCancel, ttsVoice, isAutoPlayEnabled, currentChatId, onTogglePin, onShowThinkingProcess }: ChatAreaProps) => {
  const messageFormRef = useRef<MessageFormHandle>(null);
  const [isDragging, setIsDragging] = useState(false);
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
          messages={messages} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
          ttsVoice={ttsVoice} 
          isAutoPlayEnabled={isAutoPlayEnabled}
          currentChatId={currentChatId}
          onTogglePin={onTogglePin}
          onShowThinkingProcess={onShowThinkingProcess}
      />
      <div className="mt-auto pt-4 px-4 sm:px-6 md:px-8">
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
