/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionCall } from '@google/genai';

export type ToolCallEvent = {
    id: string;
    call: FunctionCall;
    result?: string;
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
        // The message of this ToolError instance will be what's thrown.
        super(`Tool '${toolName}' failed with code ${code}. Reason: ${originalMessage}`);
        this.name = 'ToolError';
        this.code = code;
        this.cause = cause;
    }
}

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  toolCallEvents?: ToolCallEvent[];
  error?: MessageError;
  isHidden?: boolean;
};

export type ChatSession = {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    isLoading?: boolean;
};