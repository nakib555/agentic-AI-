
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { MessageList, type MessageListHandle } from './MessageList';
import { MessageForm, type MessageFormHandle } from './MessageForm/index';
import type { Message, Source } from '../../types';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  isAppLoading: boolean;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  onCancel: () => void;
  ttsVoice: string;
  ttsModel: string;
  setTtsVoice: (voice: string) => void;
  currentChatId: string | null;
  activeModel: string;
  onShowSources: (sources: Source[]) => void;
  messageListRef: React.RefObject<MessageListHandle>;
  onRegenerate: (messageId: string) => void;
  onSetActiveResponseIndex: (messageId: string, index: number) => void;
  backendStatus: 'online' | 'offline' | 'checking';
  backendError: string | null;
  onRetryConnection: () => void;
  hasApiKey: boolean;
  onEditMessage?: (messageId: string, newText: string) => void;
  onNavigateBranch?: (messageId: string, direction: 'next' | 'prev') => void;
};

export const ChatArea = ({ 
    messages, isLoading, isAppLoading, sendMessage, onCancel, 
    ttsVoice, ttsModel, setTtsVoice, currentChatId, activeModel,
    onShowSources,
    messageListRef, onRegenerate, onSetActiveResponseIndex,
    backendStatus, backendError, onRetryConnection, hasApiKey,
    onEditMessage, onNavigateBranch
}: ChatAreaProps) => {
  const messageFormRef = useRef<MessageFormHandle>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragCounter = useRef(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
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
      messageFormRef.current?.attachFiles(Array.from(files));
    }
  };

  const handleSetActiveResponseIndex = useCallback((messageId: string, index: number) => {
    if (currentChatId) {
      onSetActiveResponseIndex(messageId, index);
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
            className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 border-2 border-dashed border-indigo-500 dark:border-indigo-400 rounded-2xl z-30 flex items-center justify-center m-4 pointer-events-none"
          >
            <div className="text-center font-bold text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-black/80 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm">
              <p className="text-lg">Drop files to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MessageList
          key={currentChatId || 'empty'}
          ref={messageListRef}
          messages={messages} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
          ttsVoice={ttsVoice}
          ttsModel={ttsModel} 
          currentChatId={currentChatId} 
          onShowSources={onShowSources}
          messageFormRef={messageFormRef}
          onRegenerate={onRegenerate}
          onSetActiveResponseIndex={handleSetActiveResponseIndex}
          isAgentMode={false} // Permanently disabled
          onEditMessage={onEditMessage}
          onNavigateBranch={onNavigateBranch}
      />
      <div className="p-4 sm:px-8 pb-6 flex-shrink-0 z-20">
          <MessageForm
            ref={messageFormRef}
            onSubmit={sendMessage} 
            isLoading={isLoading} 
            isAppLoading={isAppLoading}
            backendStatus={backendStatus}
            onCancel={onCancel}
            messages={messages}
            hasApiKey={hasApiKey}
            ttsVoice={ttsVoice}
            setTtsVoice={setTtsVoice}
            currentChatId={currentChatId}
            activeModel={activeModel}
          />
      </div>
    </div>
  );
};
