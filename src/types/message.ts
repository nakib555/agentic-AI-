/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionCall } from '@google/genai';
import type { MessageError } from './error';

export type ToolCallEvent = {
    id: string;
    call: FunctionCall;
    result?: string;
    startTime?: number;
    endTime?: number;
};

export type Attachment = {
  name: string;
  mimeType: string;
  data: string; // base64 encoded string
};

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  toolCallEvents?: ToolCallEvent[];
  error?: MessageError;
  isHidden?: boolean;
  attachments?: Attachment[];
  startTime?: number;
  endTime?: number;
};