/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionCall } from '@google/genai';

export type ToolCallEvent = {
    id: string;
    call: FunctionCall;
    result?: string;
    startTime?: number;
    endTime?: number;
};

export type MessageError = {
    code?: string;
    message: string;
    details?: string;
};

export class ToolError extends Error {
    public cause?: Error;
    public code: string;
    
    constructor(
        public toolName: string,
        code: string,
        public originalMessage: string,
        cause?: Error
    ) {
        super(`Tool '${toolName}' failed with code ${code}. Reason: ${originalMessage}`);
        this.name = 'ToolError';
        this.code = code;
        this.cause = cause;
    }
}

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

export type ChatSession = {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    isLoading?: boolean;
    createdAt: number;
};