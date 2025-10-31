/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { Message } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen';
import type { MessageFormHandle } from './MessageForm';

export type MessageListHandle = {
  scrollToBottom: () => void;
};

type MessageListProps = {
  messages: Message[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  isLoading: boolean;
  ttsVoice: string;
  isAutoPlayEnabled: boolean;
  currentChatId: string | null;
  onTogglePin: (chatId: string, messageId: string) => void;
  onShowThinkingProcess: (messageId: string) => void;
  onScrolledUpChange: (isScrolledUp: boolean) => void;
  approveExecution: () => void;
  denyExecution: () => void;
  messageFormRef: React.RefObject<MessageFormHandle>;
};

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(({ 
    messages, sendMessage, isLoading, ttsVoice, isAutoPlayEnabled, currentChatId, 
    onTogglePin, onShowThinkingProcess, onScrolledUpChange, approveExecution, 
    denyExecution, messageFormRef 
}, ref) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageText = messages[messages.length - 1]?.text;
  
  // This state tracks if the user has manually scrolled away from the bottom.
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      // If the user manually clicks the button, we should resume auto-scrolling for the next message.
      setIsAutoScrollPaused(false);
    },
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
  }, [messages.length, lastMessageText, isLoading, isAutoScrollPaused]);

  /**
   * This handler is attached to the scrollable message list. It determines whether
   * to pause or resume auto-scrolling based on the user's scroll position.
   */
  const handleScroll = () => {
    const element = messageListRef.current;
    if (!element) return;
    
    const SCROLL_THRESHOLD = 200; // Pixels from bottom to show the "scroll to latest" button
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    const isCurrentlyScrolledUp = scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD;
    onScrolledUpChange(isCurrentlyScrolledUp);

    // We only care about user scrolling while the AI is generating a response.
    if (!isLoading) return;

    // A small threshold helps account for rendering variations.
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 5;

    // Pause if the user scrolls up, resume if they scroll back to the bottom.
    setIsAutoScrollPaused(!isAtBottom);
  };

  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div className="flex-1 overflow-y-auto" ref={messageListRef} onScroll={handleScroll}>
      <div className="h-full px-4 sm:px-6 md:px-8">
        {visibleMessages.length === 0 ? (
          <WelcomeScreen sendMessage={sendMessage} />
        ) : (
          <div className="space-y-8 md:space-y-10 py-4" role="log" aria-live="polite">
            {visibleMessages.map((msg) => (
              <MessageComponent 
                  key={msg.id} 
                  msg={msg} 
                  isLoading={isLoading}
                  sendMessage={sendMessage} 
                  ttsVoice={ttsVoice} 
                  isAutoPlayEnabled={isAutoPlayEnabled}
                  currentChatId={currentChatId}
                  onTogglePin={onTogglePin}
                  onShowThinkingProcess={onShowThinkingProcess}
                  approveExecution={approveExecution}
                  denyExecution={denyExecution}
                  messageFormRef={messageFormRef}
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