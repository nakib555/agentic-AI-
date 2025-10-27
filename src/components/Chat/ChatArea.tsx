/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
import { MessageList } from './MessageList';
import { MessageForm } from './MessageForm';
import type { Message } from '../../../types';

type ChatAreaProps = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  modelsLoading: boolean;
  onCancel: () => void;
  ttsVoice: string;
  isAutoPlayEnabled: boolean;
};

export const ChatArea = ({ messages, isLoading, sendMessage, modelsLoading, onCancel, ttsVoice, isAutoPlayEnabled }: ChatAreaProps) => (
  <div className="flex-1 flex flex-col pb-4 min-h-0">
    <MessageList messages={messages} sendMessage={sendMessage} isLoading={isLoading} ttsVoice={ttsVoice} isAutoPlayEnabled={isAutoPlayEnabled} />
    <div className="mt-auto pt-4 px-4 sm:px-6 md:px-8">
      <div className="relative w-full max-w-3xl mx-auto">
        <MessageForm 
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