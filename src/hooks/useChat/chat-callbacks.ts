/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { FunctionCall } from "@google/genai";
import { generateFollowUpSuggestions } from '../../services/gemini/index';
import { type ToolCallEvent, type MessageError, ChatSession, ModelResponse, Message } from '../../types';
// Fix: Import ParsedWorkflow from the correct path.
import type { ParsedWorkflow } from '../../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatHistoryState = {
    chatHistory: ChatSession[];
    updateActiveResponseOnMessage: (chatId: string, messageId: string, updateFn: (response: ModelResponse) => Partial<ModelResponse>) => void;
    updateMessage: (chatId: string, messageId: string, update: Partial<Message>) => void;
    completeChatLoading: (chatId: string) => void;
};

type AbortState = {
    abortControllerRef: React.MutableRefObject<AbortController | null>;
};

export const createAgentCallbacks = (
    activeChatId: string,
    messageId: string,
    historyState: ChatHistoryState,
    abortState: AbortState,
    isThinkingModeEnabled: boolean,
    executionApprovalRef: React.MutableRefObject<{ resolve: (approved: boolean | string) => void } | null>
) => {
    const { chatHistory, updateActiveResponseOnMessage, updateMessage, completeChatLoading } = historyState;
    const { abortControllerRef } = abortState;

    return {
        onTextChunk: (fullText: string) => {
            updateActiveResponseOnMessage(activeChatId, messageId, () => ({ text: fullText }));
        },
        onNewToolCalls: (toolCalls: FunctionCall[]): Promise<ToolCallEvent[]> => {
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({ 
                id: generateId(), 
                call: fc,
                startTime: Date.now(),
            }));
            updateActiveResponseOnMessage(activeChatId, messageId, (response) => ({
                toolCallEvents: [...(response.toolCallEvents || []), ...newToolCallEvents]
            }));
            return Promise.resolve(newToolCallEvents);
        },
        onToolResult: (eventId: string, result: string) => {
            updateActiveResponseOnMessage(activeChatId, messageId, (response) => {
                if (!response.toolCallEvents) return {};
                return {
                    toolCallEvents: response.toolCallEvents.map(event => 
                        event.id === eventId ? { ...event, result, endTime: Date.now() } : event
                    )
                };
            });
        },
        onPlanReady: (plan: ParsedWorkflow): Promise<boolean | string> => {
            if (!isThinkingModeEnabled) {
                return Promise.resolve(true);
            }
            updateActiveResponseOnMessage(activeChatId, messageId, () => ({ plan }));
            updateMessage(activeChatId, messageId, { executionState: 'pending_approval' });
            return new Promise((resolve) => {
                executionApprovalRef.current = { resolve };
            });
        },
        onComplete: async (finalText: string, groundingMetadata?: any) => {
            updateActiveResponseOnMessage(activeChatId, messageId, () => ({
                text: finalText,
                endTime: Date.now(),
                groundingMetadata,
            }));
            updateMessage(activeChatId, messageId, { isThinking: false });
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
            
            const originalChat = chatHistory.find(c => c.id === activeChatId);
            if (originalChat) {
                // Construct the most up-to-date message list for suggestion generation
                const updatedMessages = originalChat.messages.map(msg => {
                    if (msg.id === messageId) {
                        const updatedMsg = { ...msg, isThinking: false };
                        if (updatedMsg.responses) {
                            const activeIndex = updatedMsg.activeResponseIndex;
                            updatedMsg.responses[activeIndex] = {
                                ...updatedMsg.responses[activeIndex],
                                text: finalText,
                                endTime: Date.now(),
                                groundingMetadata,
                            };
                        }
                        return updatedMsg;
                    }
                    return msg;
                });

                const suggestions = await generateFollowUpSuggestions(updatedMessages);
                if (suggestions.length > 0) {
                    updateActiveResponseOnMessage(activeChatId, messageId, () => ({ suggestedActions: suggestions }));
                }
            }
        },
        onCancel: () => {
            updateActiveResponseOnMessage(activeChatId, messageId, (response) => ({
                text: `${response.text.trim()}\n\n**(Generation stopped by user)**`,
                endTime: Date.now(),
            }));
            updateMessage(activeChatId, messageId, { isThinking: false });
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
        },
        onError: (error: MessageError) => {
            console.error("Error in agentic loop:", error);
            updateActiveResponseOnMessage(activeChatId, messageId, () => ({ error, endTime: Date.now() }));
            updateMessage(activeChatId, messageId, { isThinking: false });
            completeChatLoading(activeChatId);
            abortControllerRef.current = null;
        },
    };
};