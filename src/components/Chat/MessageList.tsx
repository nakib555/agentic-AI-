
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { Message, Source } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen/index';
import type { MessageFormHandle } from './MessageForm/index';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

export type MessageListHandle = {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
};

type MessageListProps = {
  messages: Message[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  isLoading: boolean;
  ttsVoice: string;
  isAutoPlayEnabled: boolean;
  currentChatId: string | null;
  onShowThinkingProcess: (messageId: string) => void;
  onShowSources: (sources: Source[]) => void;
  onScrolledUpChange: (isScrolledUp: boolean) => void;
  approveExecution: (editedPlan: string) => void;
  denyExecution: () => void;
  messageFormRef: React.RefObject<MessageFormHandle>;
  onRegenerate: (messageId: string) => void;
  onSetActiveResponseIndex: (messageId: string, index: number) => void;
  isAgentMode: boolean;
};

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(({ 
    messages, sendMessage, isLoading, ttsVoice, isAutoPlayEnabled, currentChatId, 
    onShowThinkingProcess, onShowSources, onScrolledUpChange, approveExecution, 
    denyExecution, messageFormRef, onRegenerate, onSetActiveResponseIndex,
    isAgentMode
}, ref) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = lastMessage?.role === 'model' 
    ? lastMessage.responses?.[lastMessage.activeResponseIndex]?.text 
    : lastMessage?.text;
  
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const throttleTimeout = useRef<number | null>(null);
  
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (messageListRef.current) {
        messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
      }
      setIsAutoScrollPaused(false);
    },
    scrollToMessage: (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-jump');
            setTimeout(() => {
                element.classList.remove('highlight-jump');
            }, 2000);
        }
    }
  }));

  useEffect(() => {
    if (isLoading && !isAutoScrollPaused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (!isLoading) {
      setIsAutoScrollPaused(false);
    }
  }, [messages.length, lastMessageContent, isLoading, isAutoScrollPaused]);
  
  useEffect(() => {
      return () => {
          if (throttleTimeout.current) {
              window.clearTimeout(throttleTimeout.current);
          }
      };
  }, []);

  const handleScroll = useCallback(() => {
    if (throttleTimeout.current) return;

    throttleTimeout.current = window.setTimeout(() => {
        const element = messageListRef.current;
        if (!element) {
            throttleTimeout.current = null;
            return;
        };
        
        const SCROLL_THRESHOLD = 200;
        const { scrollTop, scrollHeight, clientHeight } = element;
        
        const isCurrentlyScrolledUp = scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD;
        setShowScrollButton(isCurrentlyScrolledUp);
        onScrolledUpChange(isCurrentlyScrolledUp);

        if (isLoading) {
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
            setIsAutoScrollPaused(!isAtBottom);
        }

        throttleTimeout.current = null;
    }, 100);
  }, [isLoading, onScrolledUpChange]);


  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth relative" ref={messageListRef} onScroll={handleScroll}>
      <div className={`min-h-full flex w-full justify-center px-4 sm:px-6 md:px-8 ${visibleMessages.length > 0 ? 'items-end' : 'items-center'}`}>
        {visibleMessages.length === 0 ? (
          <WelcomeScreen sendMessage={sendMessage} />
        ) : (
          <div className="space-y-8 md:space-y-10 py-4 w-full" role="log" aria-live="polite">
            {visibleMessages.map((msg) => (
              <MessageComponent 
                  key={msg.id} 
                  msg={msg} 
                  isLoading={isLoading}
                  sendMessage={sendMessage} 
                  ttsVoice={ttsVoice} 
                  isAutoPlayEnabled={isAutoPlayEnabled}
                  currentChatId={currentChatId}
                  onShowThinkingProcess={onShowThinkingProcess}
                  onShowSources={onShowSources}
                  approveExecution={approveExecution}
                  denyExecution={denyExecution}
                  messageFormRef={messageFormRef}
                  onRegenerate={onRegenerate}
                  onSetActiveResponseIndex={onSetActiveResponseIndex}
                  isAgentMode={isAgentMode}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll Button */}
      <AnimatePresence initial={false}>
        {showScrollButton && (
          <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             transition={{ type: "spring", stiffness: 300, damping: 25 }}
             className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20"
          >
            <button
                onClick={() => {
                    if (messageListRef.current) {
                        messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
                    }
                    setIsAutoScrollPaused(false);
                }}
                className="pointer-events-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-white/10 px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8 12.25a.75.75 0 0 1-.53-.22l-4.25-4.25a.75.75 0 1 1 1.06-1.06L8 10.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-.53.22Z" clipRule="evenodd" />
                </svg>
                <span>Scroll to latest</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
