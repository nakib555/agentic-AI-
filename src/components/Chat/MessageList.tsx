/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { Message } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen/index';
import type { MessageFormHandle } from './MessageForm/index';

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
    onShowThinkingProcess, onScrolledUpChange, approveExecution, 
    denyExecution, messageFormRef, onRegenerate, onSetActiveResponseIndex,
    isAgentMode
}, ref) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // A more robust way to track the last message, accounting for the new data structure.
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = lastMessage?.role === 'model' 
    ? lastMessage.responses?.[lastMessage.activeResponseIndex]?.text 
    : lastMessage?.text;
  
  // This state tracks if the user has manually scrolled away from the bottom.
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const throttleTimeout = useRef<number | null>(null);
  
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (messageListRef.current) {
        // Use the two-argument version of scrollTo for maximum reliability.
        messageListRef.current.scrollTo(0, messageListRef.current.scrollHeight);
      }
      // If the user manually clicks the button, we should resume auto-scrolling for the next message.
      setIsAutoScrollPaused(false);
    },
    scrollToMessage: (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect to draw attention to the message.
            element.classList.add('highlight-jump');
            setTimeout(() => {
                element.classList.remove('highlight-jump');
            }, 2000);
        }
    }
  }));

  // This effect handles the core auto-scrolling logic.
  useEffect(() => {
    // It only triggers if an AI response is in progress AND the user has not paused it.
    if (isLoading && !isAutoScrollPaused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // When a message stream ends, we reset the pause state so the next message auto-scrolls again.
    if (!isLoading) {
      setIsAutoScrollPaused(false);
    }
  }, [messages.length, lastMessageContent, isLoading, isAutoScrollPaused]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
      return () => {
          if (throttleTimeout.current) {
              window.clearTimeout(throttleTimeout.current);
          }
      };
  }, []);

  /**
   * This handler is attached to the scrollable message list. It determines whether
   * to pause or resume auto-scrolling based on the user's scroll position.
   * It is throttled to prevent performance issues.
   */
  const handleScroll = useCallback(() => {
    if (throttleTimeout.current) return;

    throttleTimeout.current = window.setTimeout(() => {
        const element = messageListRef.current;
        if (!element) {
            throttleTimeout.current = null;
            return;
        };
        
        const SCROLL_THRESHOLD = 200; // Pixels from bottom to show the "scroll to latest" button
        const { scrollTop, scrollHeight, clientHeight } = element;
        
        const isCurrentlyScrolledUp = scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD;
        onScrolledUpChange(isCurrentlyScrolledUp);

        if (isLoading) {
            // A small threshold helps account for rendering variations.
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 5;
            // Pause if the user scrolls up, resume if they scroll back to the bottom.
            setIsAutoScrollPaused(!isAtBottom);
        }

        throttleTimeout.current = null;
    }, 100); // Throttle scroll events to every 100ms
  }, [isLoading, onScrolledUpChange]);


  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div className="flex-1 overflow-y-auto" ref={messageListRef} onScroll={handleScroll}>
      <div className={`min-h-full flex w-full justify-center px-4 sm:px-6 md:px-8 ${visibleMessages.length > 0 ? 'items-start' : 'items-center'}`}>
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
                  approveExecution={approveExecution}
                  denyExecution={denyExecution}
                  messageFormRef={messageFormRef}
                  onRegenerate={onRegenerate}
                  onSetActiveResponseIndex={onSetActiveResponseIndex}
                  isAgentMode={isAgentMode}
              />
            ))}
            {/* The invisible anchor element that we scroll to. */}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
});