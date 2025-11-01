/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Message } from '../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage/index';
// FIX: Fix module import path for `MessageFormHandle` to point to the barrel file, resolving ambiguity with an empty `MessageForm.tsx` file.
import type { MessageFormHandle } from './MessageForm/index';

export const MessageComponent: React.FC<{ 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onTogglePin: (chatId: string, messageId: string) => void;
    onShowThinkingProcess: (messageId: string) => void;
    approveExecution: () => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
}> = ({ 
    msg, isLoading, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, 
    onTogglePin, onShowThinkingProcess, approveExecution, denyExecution, messageFormRef 
}) => {
  const messageContent = () => {
    if (msg.role === 'user') {
        return <UserMessage msg={msg} currentChatId={currentChatId} onTogglePin={onTogglePin} />;
    }
    
    if (msg.role === 'model') {
        return (
            <AiMessage 
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
        );
    }
    return null;
  };

  return (
    <div id={`message-${msg.id}`}>
        {messageContent()}
    </div>
  );
};
