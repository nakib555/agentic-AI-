/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Message } from '../../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage';

export const MessageComponent: React.FC<{ 
    msg: Message; 
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onTogglePin: (chatId: string, messageId: string) => void;
    onShowThinkingProcess: (messageId: string) => void;
}> = ({ msg, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, onTogglePin, onShowThinkingProcess }) => {
  const messageContent = () => {
    if (msg.role === 'user') {
        return <UserMessage msg={msg} currentChatId={currentChatId} onTogglePin={onTogglePin} />;
    }
    
    if (msg.role === 'model') {
        return <AiMessage msg={msg} sendMessage={sendMessage} ttsVoice={ttsVoice} isAutoPlayEnabled={isAutoPlayEnabled} currentChatId={currentChatId} onTogglePin={onTogglePin} onShowThinkingProcess={onShowThinkingProcess} />;
    }
    return null;
  };

  return (
    <div id={`message-${msg.id}`}>
        {messageContent()}
    </div>
  );
};
