/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen';

type MessageListProps = {
  messages: Message[];
};

export const MessageList = ({ messages }: MessageListProps) => {
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageListRef.current) {
      // A small timeout allows the content to render before scrolling
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div className="flex-1 overflow-y-auto px-2 scroll-smooth" ref={messageListRef}>
      {visibleMessages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <div className="space-y-4 md:space-y-6" role="log" aria-live="polite">
          {visibleMessages.map((msg) => (
            <MessageComponent key={msg.id} msg={msg} />
          ))}
        </div>
      )}
    </div>
  );
};