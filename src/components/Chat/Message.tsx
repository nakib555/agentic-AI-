/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Message } from '../../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage';

export const MessageComponent: React.FC<{ msg: Message; sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; ttsVoice: string; isAutoPlayEnabled: boolean; }> = ({ msg, sendMessage, ttsVoice, isAutoPlayEnabled }) => {
  if (msg.role === 'user') {
    return <UserMessage msg={msg} />;
  }
  
  if (msg.role === 'model') {
    return <AiMessage msg={msg} sendMessage={sendMessage} ttsVoice={ttsVoice} isAutoPlayEnabled={isAutoPlayEnabled} />;
  }

  return null;
};