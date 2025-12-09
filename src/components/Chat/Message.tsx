
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import type { Message, Source } from '../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage/index';
import type { MessageFormHandle } from './MessageForm/index';

const MessageComponentRaw: React.FC<{ 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    ttsModel: string;
    currentChatId: string | null;
    onShowSources: (sources: Source[]) => void;
    approveExecution: (editedPlan: string) => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
    onRegenerate: (messageId: string) => void;
    onSetActiveResponseIndex: (messageId: string, index: number) => void;
    isAgentMode: boolean;
}> = ({ 
    msg, isLoading, sendMessage, ttsVoice, ttsModel, currentChatId, 
    onShowSources, approveExecution, denyExecution, messageFormRef,
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
                ttsModel={ttsModel} 
                currentChatId={currentChatId} 
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
    <div id={`message-${msg.id}`} className="contain-content">
        {messageContent()}
    </div>
  );
};

export const MessageComponent = memo(MessageComponentRaw, (prevProps, nextProps) => {
    // Custom comparison for high performance
    const msgChanged = 
        prevProps.msg.text !== nextProps.msg.text ||
        prevProps.msg.isThinking !== nextProps.msg.isThinking ||
        prevProps.msg.activeResponseIndex !== nextProps.msg.activeResponseIndex ||
        prevProps.msg.responses?.length !== nextProps.msg.responses?.length ||
        prevProps.msg.executionState !== nextProps.msg.executionState;

    // If the message content hasn't changed, and it's not the last message (which might be loading),
    // we generally don't need to re-render. 
    // However, we must check isLoading to handle the global loading state change.
    
    return !msgChanged && prevProps.isLoading === nextProps.isLoading && prevProps.ttsVoice === nextProps.ttsVoice && prevProps.ttsModel === nextProps.ttsModel;
});
