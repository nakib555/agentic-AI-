/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageForm } from './MessageForm';
import { FloatingPrompts } from './FloatingPrompts';
import type { Message } from '../../../types';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string, files?: File[]) => void;
  modelsLoading: boolean;
  onCancel: () => void;
};

export const ChatArea = ({ messages, isLoading, sendMessage, modelsLoading, onCancel }: ChatAreaProps) => (
  <div className="flex-1 flex flex-col pb-4 min-h-0">
    <MessageList messages={messages} sendMessage={sendMessage} />
    <div className="mt-auto pt-4 px-4 sm:px-6 md:px-8">
      <AnimatePresence>
        {messages.length === 0 && !isLoading && !modelsLoading && (
          <FloatingPrompts onPromptClick={sendMessage} />
        )}
      </AnimatePresence>
      <div className="relative">
        <MessageForm 
          onSubmit={sendMessage} 
          isLoading={isLoading || modelsLoading} 
          onCancel={onCancel}
        />
      </div>
    </div>
  </div>
);