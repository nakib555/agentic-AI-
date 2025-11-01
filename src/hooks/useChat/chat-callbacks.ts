/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 1 of 4 from src/hooks/useChat.ts
// Contains the callback definitions for the agentic loop.

import type { FunctionCall } from "@google/genai";
import { generateFollowUpSuggestions } from '../../services/gemini/index';
import { type ToolCallEvent, type MessageError } from '../../types';
import type { ParsedWorkflow } from '../../services/workflowParser';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatHistoryState = {
    chatHistory: any[];
    updateLastMessage: (chatId: string, updateFn: (msg: any) => Partial<any>) => void;
    completeChatLoading: (chatId: string) => void;
};

type AbortState = {
    abortControllerRef: React.MutableRefObject<AbortController | null>;
};

export const createAgentCallbacks = (
    activeChatId: string,
    historyState: ChatHistoryState,
    abortState: AbortState,
    isThinkingModeEnabled: boolean,
    executionApprovalRef: React.MutableRefObject<{ resolve: (approved: boolean) => void } | null>
) => {
    const { chatHistory, updateLastMessage, completeChatLoading } = historyState;
    const { abortControllerRef } = abortState;

    return {
        onTextChunk: (fullText: string) => {
            updateLastMessage(activeChatId, () => ({ text: fullText }));
        },
        onNewToolCalls: (toolCalls: FunctionCall[]): Promise<ToolCallEvent[]> => {
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({ 
                id: generateId(), 
                call: fc,
                startTime: Date.now(),
            }));
            updateLastMessage(activeChatId, (lastMsg) => ({
                toolCallEvents: [...(lastMsg.toolCallEvents || []), ...newToolCallEvents]
            }));
            return Promise.resolve(newToolCallEvents);
        },
        onToolResult: (eventId: string, result: string) => {
            updateLastMessage(activeChatId, (lastMsg) => {
                if (!lastMsg.toolCallEvents) return {};
                return {
                    toolCallEvents: lastMsg.toolCallEvents.map(event => 
                        event.id === eventId ? { ...event, result, endTime: Date.now() } : event
                    )
                };
            });
        },
        onPlanReady: (plan: ParsedWorkflow): Promise<boolean> => {
            if (!isThinkingModeEnabled) {
                return Promise.resolve(true);
            }
            updateLastMessage(activeChatId, () => ({ plan, executionState: 'pending_approval' }));
            return new Promise((resolve) => {
                executionApprovalRef.current = { resolve };
            });
        },
        onComplete: async (finalText: string) => {
            updateLastMessage(activeChatId, () => ({ text: finalText, isThinking: false, endTime: Date.now() }));
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
            
            const finalChat = chatHistory.find(c => c.id === activeChatId);
            if (finalChat) {
                const suggestions = await generateFollowUpSuggestions(finalChat.messages);
                if (suggestions.length > 0) {
                    updateLastMessage(activeChatId, () => ({ suggestedActions: suggestions }));
                }
            }
        },
        onCancel: () => {
            updateLastMessage(activeChatId, (lastMsg) => ({
                text: `${lastMsg.text.trim()}\n\n**(Generation stopped by user)**`,
                isThinking: false,
                endTime: Date.now(),
            }));
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
        },
        onError: (error: MessageError) => {
            console.error("Error in agentic loop:", error);
            updateLastMessage(activeChatId, () => ({ error: error, isThinking: false, endTime: Date.now() }));
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
        },
    };
};
