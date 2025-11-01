/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Defines types for the refactored agenticLoop service.

import type { FunctionCall, GenerateContentResponse, Part } from '@google/genai';
import type { MessageError } from '../../types';
import type { ParsedWorkflow } from '../workflowParser';

type ChatHistory = { role: 'user' | 'model'; parts: Part[] }[];
type ChatSettings = { systemPrompt?: string; temperature?: number; maxOutputTokens?: number; thinkingBudget?: number; memoryContent?: string };

export type AgenticLoopCallbacks = {
    onTextChunk: (fullText: string) => void;
    onNewToolCalls: (toolCalls: FunctionCall[]) => Promise<any[]>;
    onToolResult: (eventId: string, result: string) => void;
    onPlanReady: (plan: ParsedWorkflow) => Promise<boolean>;
    onComplete: (finalText: string) => void;
    onCancel: () => void;
    onError: (error: MessageError) => void;
};

export type RunAgenticLoopParams = {
    model: string;
    history: ChatHistory;
    toolExecutor: (name: string, args: any) => Promise<string>;
    callbacks: AgenticLoopCallbacks;
    settings: ChatSettings;
    signal: AbortSignal;
};

export type StreamProcessorParams = {
    stream: AsyncGenerator<GenerateContentResponse>;
    signal: AbortSignal;
    callbacks: AgenticLoopCallbacks;
    fullModelResponseText: string;
    planApproved: boolean;
};

type StreamResultBase = {
    fullText: string;
    planApproved: boolean;
};

export type StreamProcessorResult =
    | ({ status: 'aborted' })
    | ({ status: 'error'; error: MessageError })
    | (StreamResultBase & { status: 'complete' })
    | (StreamResultBase & { status: 'running'; nextAction: 'continue_generation'; currentTurnText: string; })
    | (StreamResultBase & { status: 'running'; nextAction: 'continue_with_tools'; functionCalls: FunctionCall[]; modelTurnParts: Part[]; });
