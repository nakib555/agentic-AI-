/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageForm } from './MessageForm';
import { FloatingPrompts } from './FloatingPrompts';
import type { Message } from '../../types';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => void;
  modelsLoading: boolean;
};

export const ChatArea = ({ messages, isLoading, sendMessage, modelsLoading }: ChatAreaProps) => (
  <div className="flex-1 flex flex-col pb-4 min-h-0">
    <MessageList messages={messages} />
    <div className="mt-auto pt-4">
      <AnimatePresence>
        {messages.length === 0 && !isLoading && (
          <FloatingPrompts onPromptClick={sendMessage} />
        )}
      </AnimatePresence>
      <div className="relative">
        <MessageForm onSubmit={sendMessage} isLoading={isLoading || modelsLoading} />
      </div>
    </div>
  </div>
);