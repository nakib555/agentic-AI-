/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { type Message, type ChatSession, ModelResponse } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { generateChatTitle, parseApiError, generateFollowUpSuggestions } from '../../services/gemini/index';
import { API_BASE_URL } from '../../utils/api';
import { toolImplementations as frontendToolImplementations } from '../../tools';
import { buildApiHistory } from './history-builder';
import { toolDeclarations } from '../../tools/declarations';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string, isAgentMode: boolean) => {
    const chatHistoryHook = useChatHistory();
    const { chatHistory, currentChatId, updateChatTitle } = chatHistoryHook;
    const abortControllerRef = useRef<AbortController | null>(null);

    // Refs to hold the latest state for callbacks
    const chatHistoryRef = useRef(chatHistory);
    useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
    const currentChatIdRef = useRef(currentChatId);
    useEffect(() => { currentChatIdRef.current = currentChatId; }, [currentChatId]);

    const messages = useMemo(() => {
        return chatHistory.find(c => c.id === currentChatId)?.messages || [];
    }, [chatHistory, currentChatId]);

    const isLoading = useMemo(() => {
        if (!currentChatId) return false;
        return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
    }, [chatHistory, currentChatId]);

    const handleFrontendToolExecution = useCallback(async (callId: string, toolName: string, toolArgs: any) => {
        console.log(`[FRONTEND] Received request to execute tool: ${toolName}`, { callId, toolArgs });
        try {
            let result: any;
            if (toolName === 'approveExecution') {
                result = toolArgs; // The edited plan string
            } else if (toolName === 'denyExecution') {
                result = false;
            } else {
                 const toolImplementation = (frontendToolImplementations as any)[toolName];
                 if (!toolImplementation) throw new Error(`Frontend tool not found: ${toolName}`);
                 result = await toolImplementation(toolArgs);
            }
            console.log(`[FRONTEND] Tool '${toolName}' executed successfully. Sending result to backend.`, { callId, result });
            await fetch(`${API_BASE_URL}/api/handler?task=tool_response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callId, result }),
            });
        } catch (error) {
            const parsedError = parseApiError(error);
            console.error(`[FRONTEND] Tool '${toolName}' execution failed. Sending error to backend.`, { callId, error: parsedError });
            await fetch(`${API_BASE_URL}/api/handler?task=tool_response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callId, error: parsedError.message }),
            });
        }
    }, []);


    const cancelGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        // Also send a tool response for the plan if it's pending, to unblock the backend
        handleFrontendToolExecution('plan-approval', 'denyExecution', false);
    }, [handleFrontendToolExecution]);
    
    const { updateMessage } = chatHistoryHook;
    
    const approveExecution = useCallback((editedPlan: string) => {
        const chatId = currentChatIdRef.current;
        if (chatId) {
            const currentChat = chatHistoryRef.current.find(c => c.id === chatId);
            if (currentChat?.messages.length) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];
                updateMessage(chatId, lastMessage.id, { executionState: 'approved' });
                handleFrontendToolExecution('plan-approval', 'approveExecution', editedPlan);
            }
        }
    }, [updateMessage, handleFrontendToolExecution]);
  
    const denyExecution = useCallback(() => {
        const chatId = currentChatIdRef.current;
        if (chatId) {
            const currentChat = chatHistoryRef.current.find(c => c.id === chatId);
            if (currentChat?.messages.length) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];
                updateMessage(chatId, lastMessage.id, { executionState: 'denied' });
                handleFrontendToolExecution('plan-approval', 'denyExecution', false);
            }
        }
    }, [updateMessage, handleFrontendToolExecution]);


    const processBackendStream = async (chatId: string, messageId: string, response: Response) => {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const event = JSON.parse(line);
                    console.log('[FRONTEND] Received stream event:', event);
                    switch (event.type) {
                        case 'text-chunk':
                            chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ text: event.payload }));
                            break;
                        case 'tool-call-start':
                            const newToolCallEvents = event.payload.map((toolEvent: any) => ({ 
                                id: toolEvent.id, 
                                call: toolEvent.call, 
                                startTime: Date.now() 
                            }));
                            chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => ({ toolCallEvents: [...(r.toolCallEvents || []), ...newToolCallEvents] }));
                            break;
                        case 'tool-call-end':
                             chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => ({
                                toolCallEvents: r.toolCallEvents?.map(tc => tc.id === event.payload.id ? { ...tc, result: event.payload.result, endTime: Date.now() } : tc)
                            }));
                            break;
                        case 'plan-ready':
                            chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ plan: event.payload }));
                            chatHistoryHook.updateMessage(chatId, messageId, { executionState: 'pending_approval' });
                            break;
                        case 'frontend-tool-request':
                            handleFrontendToolExecution(event.payload.callId, event.payload.toolName, event.payload.toolArgs);
                            break;
                        case 'complete':
                            chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ text: event.payload.finalText, endTime: Date.now(), groundingMetadata: event.payload.groundingMetadata }));
                            break;
                        case 'error':
                             chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error: event.payload, endTime: Date.now() }));
                            break;
                    }
                } catch(e) {
                    console.error("[FRONTEND] Failed to parse stream event:", line, e);
                }
            }
        }
    };
    
    const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean, isThinkingModeEnabled?: boolean } = {}) => {
        console.log('[FRONTEND] sendMessage called.', { userMessage, files: files?.map(f => f.name), options });
        if (isLoading) cancelGeneration();
    
        let activeChatId = currentChatId;
        const currentChat = currentChatId ? chatHistory.find(c => c.id === currentChatId) : undefined;
        let messagesForHistory = currentChat ? currentChat.messages : [];

        if (!activeChatId || !currentChat) {
            activeChatId = chatHistoryHook.createNewChat(initialModel, {
                temperature: settings.temperature,
                maxOutputTokens: settings.maxOutputTokens,
                imageModel: settings.imageModel,
                videoModel: settings.videoModel,
            });
        }
    
        const attachmentsData = files?.length ? await Promise.all(files.map(async f => ({ name: f.name, mimeType: f.type, data: await fileToBase64(f) }))) : undefined;
    
        const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden: options.isHidden, attachments: attachmentsData, activeResponseIndex: 0 };
        chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);
    
        const modelPlaceholder: Message = { id: generateId(), role: 'model', text: '', responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }], activeResponseIndex: 0, isThinking: true };
        chatHistoryHook.addMessagesToChat(activeChatId, [modelPlaceholder]);
        chatHistoryHook.setChatLoadingState(activeChatId, true);
    
        const finalMessagesForApi = [...messagesForHistory, userMessageObj];
        const historyForApi = buildApiHistory(finalMessagesForApi);
        
        const chatForSettings = currentChat || { model: initialModel, ...settings };

        await startBackendChat(activeChatId, modelPlaceholder.id, historyForApi, chatForSettings, { ...settings, isAgentMode: options.isThinkingModeEnabled ?? isAgentMode });
    };

    const regenerateResponse = useCallback(async (aiMessageId: string) => {
        console.log(`[FRONTEND] regenerateResponse called for messageId: ${aiMessageId}`);
        if (isLoading) cancelGeneration();
        if (!currentChatId) return;

        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (!currentChat) return;

        const messageIndex = currentChat.messages.findIndex(m => m.id === aiMessageId);
        if (messageIndex < 1 || currentChat.messages[messageIndex-1].role !== 'user') {
            console.error("Cannot regenerate: AI message is not preceded by a user message.");
            return;
        }

        const userMessageToResend = currentChat.messages[messageIndex - 1];
        const historyUntilUserMessage = currentChat.messages.slice(0, messageIndex - 1);
        
        const newResponse: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
        chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponse);
        chatHistoryHook.setChatLoadingState(currentChatId, true);
        chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });

        const historyForApi = buildApiHistory([...historyUntilUserMessage, userMessageToResend]);

        // We use the last user message as the final part of the history, not as a new prompt.
        // The backend `runAgenticLoop` is designed to continue a conversation from a history.
        await startBackendChat(currentChatId, aiMessageId, historyForApi, currentChat, { ...settings, isAgentMode: isAgentMode });

    }, [isLoading, currentChatId, chatHistory, cancelGeneration, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);

    const startBackendChat = async (
        chatId: string,
        messageId: string, // The ID of the model message to update
        history: any[],
        chatConfig: Pick<ChatSession, 'model' | 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>,
        runtimeSettings: { isAgentMode: boolean } & ChatSettings
    ) => {
        abortControllerRef.current = new AbortController();
        console.log('[FRONTEND] Starting backend chat stream...', { chatId, messageId, history, chatConfig, runtimeSettings });

        try {
            const response = await fetch(`${API_BASE_URL}/api/handler?task=chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    model: runtimeSettings.isAgentMode ? 'gemini-2.5-pro' : chatConfig.model,
                    history: history,
                    settings: {
                        isAgentMode: runtimeSettings.isAgentMode,
                        systemPrompt: runtimeSettings.systemPrompt,
                        temperature: chatConfig.temperature,
                        maxOutputTokens: chatConfig.maxOutputTokens,
                        imageModel: chatConfig.imageModel,
                        videoModel: chatConfig.videoModel,
                        memoryContent,
                        tools: runtimeSettings.isAgentMode ? [{ functionDeclarations: toolDeclarations }] : [{ googleSearch: {} }]
                    }
                }),
            });

            if (!response.ok || !response.body) throw new Error(await response.text() || `Request failed with status ${response.status}`);
            
            console.log('[FRONTEND] Backend stream connected.');
            await processBackendStream(chatId, messageId, response);
            console.log('[FRONTEND] Backend stream finished processing.');

        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('[FRONTEND] Backend stream failed.', { error });
                chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error: parseApiError(error), endTime: Date.now() }));
            } else {
                console.log('[FRONTEND] Backend stream aborted by user.');
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                console.log('[FRONTEND] Finalizing chat turn.');
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
                abortControllerRef.current = null;
                
                const finalChatState = chatHistoryRef.current.find(c => c.id === chatId);
                if (finalChatState) {
                    const suggestions = await generateFollowUpSuggestions(finalChatState.messages);
                     if (suggestions.length > 0) {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ suggestedActions: suggestions }));
                    }
                }
            }
        }
    };
    
    // Auto-title generation
    useEffect(() => {
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (currentChat && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
          updateChatTitle(currentChatId!, "Generating title...");
          generateChatTitle(currentChat.messages)
            .then(newTitle => {
                const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
                updateChatTitle(currentChatId!, finalTitle);
            })
            .catch(err => {
                console.error("Failed to generate chat title:", err);
                updateChatTitle(currentChatId!, "Chat"); 
            });
        }
    }, [chatHistory, currentChatId, updateChatTitle]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse };
};