/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useEffect } from 'react';
import type { FunctionCall } from "@google/genai";
import { generateChatTitle } from '../services/gemini';
import { toolImplementations } from '../tools';
import { runAgenticLoop } from '../services/agenticLoop';
import { type Message, type ToolCallEvent, type MessageError, ToolError } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { useChatHistory } from './useChatHistory';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useChat = (initialModel: string) => {
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
    completeChatLoading,
    updateChatTitle,
  } = useChatHistory();

  // Effect to automatically generate a title for new chats
  useEffect(() => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);

    // Trigger conditions: chat is new, has first exchange, and isn't loading
    if (currentChat && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
      
      // Prevent re-triggering by immediately updating the title
      updateChatTitle(currentChatId!, "Generating title...");
      
      generateChatTitle(currentChat.messages).then(newTitle => {
          // The title from generateChatTitle is already cleaned, vetted, and has a fallback.
          // We just need to apply it and handle truncation.
          const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
          updateChatTitle(currentChatId!, finalTitle);
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
        text: '[STEP] System: Loading chat history...',
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

  const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean } = {}) => {
    const { isHidden = false } = options;
    let activeChatId = currentChatId;

    // --- 1. Setup Chat Session & User Message Object ---
    if (!activeChatId) {
        activeChatId = createNewChat(initialModel);
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
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData };
    const modelMessageId = generateId();
    const modelPlaceholder: Message = { id: modelMessageId, role: 'model', text: '', isThinking: true, toolCallEvents: [] };

    // --- 2. Construct Correct API History ---
    const currentChat = chatHistory.find(c => c.id === activeChatId);
    const modelForApi = currentChat?.model || initialModel;
    
    // Combine stored messages with the new user message for a complete history context.
    const allMessagesForApi = [...(currentChat?.messages || []), userMessageObj];
    
    const historyForApi = allMessagesForApi
        .filter(msg => !msg.isHidden)
        .flatMap((msg: Message): any[] => {
            // Case 1: User message (may have text and attachments).
            if (msg.role === 'user') {
                const parts: any[] = [];
                if (msg.text) {
                    parts.push({ text: msg.text });
                }
                if (msg.attachments) {
                    msg.attachments.forEach(att => parts.push({
                        inlineData: { mimeType: att.mimeType, data: att.data }
                    }));
                }
                // The API requires at least one part. Add empty text if needed.
                if (parts.length === 0) {
                    parts.push({ text: '' });
                }
                return [{ role: 'user', parts }];
            }
            
            // Case 2: Model message. This can translate to one or two API turns (model and user/function).
            if (msg.role === 'model') {
                const turns = [];
                const modelParts: any[] = [];

                if (msg.text) {
                    modelParts.push({ text: msg.text });
                }

                // Append any function calls the model made in this turn.
                if (msg.toolCallEvents && msg.toolCallEvents.length > 0) {
                    msg.toolCallEvents.forEach(event => {
                        modelParts.push({ functionCall: event.call });
                    });
                }
                
                // If the model produced any text or function calls, add the model turn.
                if (modelParts.length > 0) {
                    turns.push({ role: 'model', parts: modelParts });
                }

                // If tools were called and have results, create a subsequent 'user' turn with the function responses.
                if (msg.toolCallEvents && msg.toolCallEvents.length > 0) {
                    const functionResponses = msg.toolCallEvents
                        .filter(event => event.result !== undefined)
                        .map(event => ({
                            functionResponse: {
                                name: event.call.name,
                                response: { result: event.result }
                            }
                        }));
                    
                    if (functionResponses.length > 0) {
                        turns.push({ role: 'user', parts: functionResponses });
                    }
                }
                
                return turns;
            }
            return []; // Should never happen with valid Message objects
        });

    // Update the UI immediately with the user's message and a thinking placeholder.
    addMessagesToChat(activeChatId, [userMessageObj, modelPlaceholder]);

    const toolExecutor = async (name: string, args: any): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 300));
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
            const lowerCaseMessage = originalError.message.toLowerCase();

            // Refine generic tool errors into specific, structured ToolErrors.
            // This centralizes error classification before it enters the agentic loop.
            if (name === 'getCurrentLocation') {
                if (lowerCaseMessage.includes('denied')) {
                    throw new ToolError(name, 'GEOLOCATION_PERMISSION_DENIED', originalError.message, originalError);
                }
                if (lowerCaseMessage.includes('unavailable')) {
                    throw new ToolError(name, 'GEOLOCATION_UNAVAILABLE', originalError.message, originalError);
                }
                if (lowerCaseMessage.includes('timed out')) {
                    throw new ToolError(name, 'GEOLOCATION_TIMEOUT', originalError.message, originalError);
                }
            }
            
            if (lowerCaseMessage.includes('network issue') || lowerCaseMessage.includes('failed to fetch')) {
                throw new ToolError(name, 'NETWORK_ERROR', originalError.message, originalError);
            }

            // Fallback for any other errors.
            throw new ToolError(name, 'TOOL_EXECUTION_FAILED', originalError.message, originalError);
        }
    };

    const callbacks = {
        onTextChunk: (fullText: string) => {
            updateLastMessage(activeChatId!, () => ({ text: fullText }));
        },
        onNewToolCalls: (toolCalls: FunctionCall[]): Promise<ToolCallEvent[]> => {
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({ id: generateId(), call: fc }));
            updateLastMessage(activeChatId!, (lastMsg) => {
                const updatedEvents = [...(lastMsg.toolCallEvents || []), ...newToolCallEvents];
                return { toolCallEvents: updatedEvents };
            });
            return Promise.resolve(newToolCallEvents);
        },
        onToolResult: (eventId: string, result: string) => {
            updateLastMessage(activeChatId!, (lastMsg) => {
                if (!lastMsg.toolCallEvents) return {};
                const updatedEvents = lastMsg.toolCallEvents.map(event => 
                    event.id === eventId ? { ...event, result } : event
                );
                return { toolCallEvents: updatedEvents };
            });
        },
        onComplete: (finalText: string) => {
            updateLastMessage(activeChatId!, () => ({ text: finalText, isThinking: false }));
            completeChatLoading(activeChatId!);
        },
        onError: (error: MessageError) => {
            console.error("Error received in useChat:", error);
            
            // The error from the agentic loop has a specific code, but the message might be technical.
            // Here, we refine the message for a better user experience before showing it in the UI.
            const finalError = { ...error };

            switch (error.code) {
                case 'GEOLOCATION_PERMISSION_DENIED':
                    finalError.message = 'Geolocation access was denied.';
                    break;
                case 'GEOLOCATION_UNAVAILABLE':
                    finalError.message = 'Could not determine your location.';
                    break;
                case 'GEOLOCATION_TIMEOUT':
                    finalError.message = 'The request for your location timed out.';
                    break;
                case 'NETWORK_ERROR':
                    finalError.message = 'A network issue prevented a tool from completing its task.';
                    break;
                // No default case needed; other errors will show their original message.
            }
            
            updateLastMessage(activeChatId!, () => ({ error: finalError, isThinking: false }));
            completeChatLoading(activeChatId!);
        },
    };

    // --- 3. Run Agentic Loop ---
    await runAgenticLoop({
      model: modelForApi,
      history: historyForApi,
      toolExecutor,
      callbacks,
    });
  };
  
  return { messages, sendMessage, isLoading, chatHistory, currentChatId, startNewChat, loadChat, deleteChat, clearAllChats };
};