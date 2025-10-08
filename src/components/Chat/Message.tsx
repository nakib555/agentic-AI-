/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Message } from '../../types';
import { UserMessage } from './UserMessage';
import { AiMessage } from './AiMessage';

export const MessageComponent: React.FC<{ msg: Message }> = ({ msg }) => {
  if (msg.role === 'user') {
    return <UserMessage msg={msg} />;
  }
  
  if (msg.role === 'model') {
    return <AiMessage msg={msg} />;
  }

  return null;
};