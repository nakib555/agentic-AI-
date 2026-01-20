
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Model as AppModel, Message } from '../../src/types';

export interface ModelLists {
    chatModels: AppModel[];
    imageModels: AppModel[];
    videoModels: AppModel[];
    ttsModels: AppModel[];
}

export interface ChatOptions {
    model: string;
    messages: Message[];
    newMessage?: Message | null; // For context building
    systemInstruction?: string;
    temperature: number;
    maxTokens?: number;
    apiKey?: string;
    
    // Capabilities
    isAgentMode?: boolean;
    
    // Callbacks for streaming
    callbacks: {
        onTextChunk: (text: string) => void;
        onToolCall?: (toolCall: any) => void;
        onComplete: (info: { finalText: string, groundingMetadata?: any }) => void;
        onError: (error: any) => void;
        // Specific to agentic loop (Gemini)
        onNewToolCalls?: (events: any[]) => void;
        onToolResult?: (id: string, result: any) => void;
        onPlanReady?: (plan: any) => Promise<any>;
        onFrontendToolRequest?: (callId: string, name: string, args: any) => void;
        onCancel?: () => void;
    };
    
    // Tools (Generic abstraction, provider implementation handles mapping)
    tools?: any[];
    toolExecutor?: (name: string, args: any, id: string) => Promise<string>;
    
    // Signal for aborting
    signal?: AbortSignal;
    
    // Thread ID for persistence/logging
    chatId?: string;
}

export interface CompletionOptions {
    model: string;
    prompt: string;
    systemInstruction?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    jsonMode?: boolean;
}

export interface AIProvider {
    id: string; // Unique identifier (e.g., 'gemini', 'openrouter')
    name: string; // Display name
    
    // Fetches available models from the provider
    getModels(apiKey: string): Promise<ModelLists>;
    
    // Handles a streaming chat session (including agentic loops if supported)
    chat(options: ChatOptions): Promise<void>;
    
    // Handles a single completion request (utility functions, titles, summaries)
    complete(options: CompletionOptions): Promise<string>;
}
