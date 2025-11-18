/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Message, Source } from '../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage/index';
import type { MessageFormHandle } from './MessageForm/index';

export const MessageComponent: React.FC<{ 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onShowThinkingProcess: (messageId: string) => void;
    onShowSources: (sources: Source[]) => void;
    approveExecution: (editedPlan: string) => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
    onRegenerate: (messageId: string) => void;
    onSetActiveResponseIndex: (messageId: string, index: number) => void;
    isAgentMode: boolean;
}> = ({ 
    msg, isLoading, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, 
    onShowThinkingProcess, onShowSources, approveExecution, denyExecution, messageFormRef,
    onRegenerate, onSetActiveResponseIndex, isAgentMode
}) => {
  const messageContent = () => {
    if (msg.role === 'user') {
        return <UserMessage msg={msg} />;
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
                onShowThinkingProcess={onShowThinkingProcess}
                onShowSources={onShowSources}
                approveExecution={approveExecution}
                denyExecution={denyExecution}
                messageFormRef={messageFormRef}
                onRegenerate={onRegenerate}
                onSetActiveResponseIndex={onSetActiveResponseIndex}
                isAgentMode={isAgentMode}
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