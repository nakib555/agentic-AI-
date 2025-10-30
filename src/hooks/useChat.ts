/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import type { FunctionCall, Part } from "@google/genai";
import { generateChatTitle, generateFollowUpSuggestions } from '../services/gemini';
import { toolImplementations } from '../tools';
import { runAgenticLoop } from '../services/agenticLoop';
import { type Message, type ToolCallEvent, type MessageError, ToolError, ChatSession } from '../../types';
import { fileToBase64 } from '../utils/fileUtils';
import { useChatHistory } from './useChatHistory';
import { parseMessageText } from '../utils/messageParser';
import type { ParsedWorkflow } from '../services/workflowParser';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
};

type ApiHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string) => {
  const { 
    chatHistory, 
    currentChatId,
    isHistoryLoading,
    startNewChat, 
    loadChat, 
    deleteChat, 
    clearAllChats,
    createNewChat,
    addMessagesToChat,
    updateLastMessage,
    setChatLoadingState,
    updateMessage,
    completeChatLoading,
    updateChatTitle,
    updateChatModel,
    updateChatSettings,
    toggleMessagePin,
    importChat,
  } = useChatHistory();
  const abortControllerRef = useRef<AbortController | null>(null);
  const executionApprovalRef = useRef<{ resolve: (approved: boolean) => void } | null>(null);

  // Effect to automatically generate a title for new chats
  useEffect(() => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);

    // Trigger conditions: chat is new, has first exchange, and isn't loading
    if (currentChat && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
      
      // Prevent re-triggering by immediately updating the title
      updateChatTitle(currentChatId!, "Generating title...");
      
      generateChatTitle(currentChat.messages)
        .then(newTitle => {
            // The title from generateChatTitle is already cleaned, vetted, and has a fallback.
            // We just need to apply it and handle truncation.
            const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
            updateChatTitle(currentChatId!, finalTitle);
        })
        .catch(err => {
            console.error("Failed to generate and update chat title:", err);
            // Revert to a generic title if generation fails
            updateChatTitle(currentChatId!, "Chat"); 
        });
    }
  }, [chatHistory, currentChatId, updateChatTitle]);

  const messages = useMemo(() => {
    if (isHistoryLoading) {
      // Return a placeholder message that will trigger the thinking/loading UI
      // instead of the empty welcome screen, providing a better initial load experience.
      return [{
        id: 'initial-loading-placeholder',
        role: 'model' as const,
        text: '',
        isThinking: true,
      }];
    }
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [isHistoryLoading, chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    if (isHistoryLoading) {
      return true;
    }
    if (!currentChatId) return false;
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [isHistoryLoading, chatHistory, currentChatId]);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    // If we're waiting for approval, canceling should deny it.
    if (executionApprovalRef.current) {
        denyExecution();
    }
  }, []);

  const approveExecution = useCallback(() => {
    if (executionApprovalRef.current && currentChatId) {
        updateLastMessage(currentChatId, () => ({ executionState: 'approved' }));
        executionApprovalRef.current.resolve(true);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, updateLastMessage]);
  
  const denyExecution = useCallback(() => {
    if (executionApprovalRef.current && currentChatId) {
        updateLastMessage(currentChatId, () => ({ executionState: 'denied' }));
        executionApprovalRef.current.resolve(false);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, updateLastMessage]);

  const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean, isThinkingModeEnabled?: boolean } = {}) => {
    // If a generation is already in progress, cancel it before starting a new one.
    if (isLoading) {
      cancelGeneration();
    }
    abortControllerRef.current = new AbortController();

    const { isHidden = false, isThinkingModeEnabled = false } = options;
    
    let activeChatId = currentChatId;

    // --- 1. Setup Chat Session & User Message Object ---
    if (!activeChatId) {
        activeChatId = createNewChat(initialModel, settings);
    }

    let attachmentsData: Message['attachments'] | undefined = undefined;
    if (files && files.length > 0) {
        try {
            attachmentsData = await Promise.all(files.map(async (file) => {
              const base64Data = await fileToBase64(file);
              return {
                name: file.name,
                mimeType: file.type,
                data: base64Data,
              };
            }));
        } catch (error) {
            console.error("Error converting files to base64:", error);
        }
    }
    
    const userMessageObj: Message = { 
        id: generateId(), 
        role: 'user', 
        text: userMessage, 
        isHidden, 
        attachments: attachmentsData,
    };

    addMessagesToChat(activeChatId, [userMessageObj]);

    // --- 3. Initiate Model Response ---
    setChatLoadingState(activeChatId, true);
    const modelPlaceholder: Message = { 
        id: generateId(), 
        role: 'model', 
        text: '', 
        isThinking: true, 
        toolCallEvents: [],
        startTime: Date.now(),
    };
    addMessagesToChat(activeChatId, [modelPlaceholder]);

    // --- 4. Construct Correct API History ---
    const hasVideoAttachment = userMessageObj.attachments?.some(att => att.mimeType.startsWith('video/')) ?? false;
    const modelFromChat = chatHistory.find(c => c.id === activeChatId)?.model || initialModel;

    const modelForApi = isThinkingModeEnabled || hasVideoAttachment
        ? 'gemini-2.5-pro'
        : modelFromChat;
        
    const chatSettings = {
        systemPrompt: chatHistory.find(c => c.id === activeChatId)?.systemPrompt,
        temperature: chatHistory.find(c => c.id === activeChatId)?.temperature,
        maxOutputTokens: chatHistory.find(c => c.id === activeChatId)?.maxOutputTokens,
        thinkingBudget: isThinkingModeEnabled ? 32768 : undefined,
        memoryContent: memoryContent,
    };
    
    // Get messages from before this turn and add the final user message.
    const historyBeforeThisTurn = chatHistory.find(c => c.id === activeChatId)?.messages || [];
    const allMessagesForApi = [...historyBeforeThisTurn, userMessageObj];
    
    const historyForApi: ApiHistory = [];
    allMessagesForApi.forEach((msg: Message) => {
        if (msg.isHidden) return;

        if (msg.role === 'user') {
            const textToUse = msg.text;
            const parts: Part[] = [];
            if (textToUse) parts.push({ text: textToUse });
            if (msg.attachments) {
                msg.attachments.forEach(att => parts.push({
                    inlineData: { mimeType: att.mimeType, data: att.data }
                }));
            }
            if (parts.length > 0) {
                historyForApi.push({ role: 'user', parts });
            }
        } else if (msg.role === 'model') {
            const { finalAnswerText } = parseMessageText(msg.text, false, !!msg.error);
            const modelParts: Part[] = [];
            const functionResponseParts: Part[] = [];

            if (finalAnswerText) {
                modelParts.push({ text: finalAnswerText });
            }

            if (msg.toolCallEvents) {
                msg.toolCallEvents.forEach(event => {
                    modelParts.push({ functionCall: event.call });
                    if (event.result !== undefined) {
                        functionResponseParts.push({
                            functionResponse: {
                                name: event.call.name,
                                response: { result: event.result }
                            }
                        });
                    }
                });
            }

            if (modelParts.length > 0) {
                historyForApi.push({ role: 'model', parts: modelParts });
            }
            if (functionResponseParts.length > 0) {
                historyForApi.push({ role: 'user', parts: functionResponseParts });
            }
        }
    });


    const toolExecutor = async (name: string, args: any): Promise<string> => {
        const toolImplementation = toolImplementations[name];
        if (!toolImplementation) {
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" not found.`);
        }
        try {
            return await Promise.resolve(toolImplementation(args));
        } catch (err) {
            if (err instanceof ToolError) {
                throw err; // Re-throw custom tool errors directly
            }
            const originalError = err instanceof Error ? err : new Error(String(err));
            throw new ToolError(name, 'TOOL_EXECUTION_FAILED', originalError.message, originalError);
        }
    };

    const callbacks = {
        onTextChunk: (fullText: string) => {
            updateLastMessage(activeChatId!, () => ({ text: fullText }));
        },
        onNewToolCalls: (toolCalls: FunctionCall[]): Promise<ToolCallEvent[]> => {
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({ 
                id: generateId(), 
                call: fc,
                startTime: Date.now(),
            }));
            updateLastMessage(activeChatId!, (lastMsg) => ({
                toolCallEvents: [...(lastMsg.toolCallEvents || []), ...newToolCallEvents]
            }));
            return Promise.resolve(newToolCallEvents);
        },
        onToolResult: (eventId: string, result: string) => {
            updateLastMessage(activeChatId!, (lastMsg) => {
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
                return Promise.resolve(true); // Auto-approve if not in interactive mode
            }
            updateLastMessage(activeChatId!, () => ({ plan, executionState: 'pending_approval' }));
            return new Promise((resolve) => {
                executionApprovalRef.current = { resolve };
            });
        },
        onComplete: async (finalText: string) => {
            updateLastMessage(activeChatId!, () => ({ text: finalText, isThinking: false, endTime: Date.now() }));
            completeChatLoading(activeChatId!);
            abortControllerRef.current = null;
            
            // After completion, generate follow-up suggestions
            const finalChat = chatHistory.find(c => c.id === activeChatId);
            if (finalChat) {
                const suggestions = await generateFollowUpSuggestions(finalChat.messages);
                if (suggestions.length > 0) {
                    updateLastMessage(activeChatId!, () => ({ suggestedActions: suggestions }));
                }
            }
        },
        onCancel: () => {
            updateLastMessage(activeChatId!, (lastMsg) => ({
                text: `${lastMsg.text.trim()}\n\n**(Generation stopped by user)**`,
                isThinking: false,
                endTime: Date.now(),
            }));
            completeChatLoading(activeChatId!);
            abortControllerRef.current = null;
        },
        onError: (error: MessageError) => {
            console.error("Error in agentic loop:", error);
            updateLastMessage(activeChatId!, () => ({ error: error, isThinking: false, endTime: Date.now() }));
            completeChatLoading(activeChatId!);
            abortControllerRef.current = null;
        },
    };

    // --- 5. Run Agentic Loop ---
    await runAgenticLoop({
      model: modelForApi,
      history: historyForApi,
      toolExecutor,
      callbacks,
      signal: abortControllerRef.current.signal,
      settings: chatSettings,
    });
  };
  
  return { messages, sendMessage, isLoading, chatHistory, currentChatId, startNewChat, loadChat, deleteChat, clearAllChats, cancelGeneration, updateChatModel, updateChatSettings, updateChatTitle, toggleMessagePin, approveExecution, denyExecution, importChat };
};