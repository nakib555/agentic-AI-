/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen';

type MessageListProps = {
  messages: Message[];
};

export const MessageList = ({ messages }: MessageListProps) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  // An invisible element at the end of the list to act as a scroll anchor.
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageText = messages[messages.length - 1]?.text;

  useEffect(() => {
    // The scrollIntoView method is more robust than calculating scrollHeight,
    // especially with dynamic content. It prevents conflicting scroll animations
    // during rapid streaming updates, which caused the previous glitching.
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMessageText]); // Trigger on new messages or when the last message's text updates

  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div className="flex-1 overflow-y-auto" ref={messageListRef}>
      <div className="h-full px-4 sm:px-6 md:px-8">
        {visibleMessages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="space-y-4 md:space-y-6 py-4" role="log" aria-live="polite">
            {visibleMessages.map((msg) => (
              <MessageComponent key={msg.id} msg={msg} />
            ))}
            {/* The invisible anchor element that we scroll to. */}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};