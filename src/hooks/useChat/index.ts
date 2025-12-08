
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { type Message, type ChatSession, ModelResponse } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { generateChatTitle, parseApiError, generateFollowUpSuggestions } from '../../services/gemini/index';
import { fetchFromApi } from '../../utils/api';
import { buildApiHistory } from './history-builder';
import { useToolHandler } from './useToolHandler';
import { useChatStream } from './useChatStream';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string, isAgentMode: boolean, apiKey: string) => {
    const chatHistoryHook = useChatHistory();
    const { chatHistory, currentChatId, updateChatTitle, updateMessage } = chatHistoryHook;
    
    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef<string | null>(null);
    const testResolverRef = useRef<((value: Message | PromiseLike<Message>) => void) | null>(null);
    const chatHistoryRef = useRef(chatHistory);
    const currentChatIdRef = useRef(currentChatId);

    // Sync refs
    useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
    useEffect(() => { currentChatIdRef.current = currentChatId; }, [currentChatId]);

    // Derived state
    const messages = useMemo(() => {
        return chatHistory.find(c => c.id === currentChatId)?.messages || [];
    }, [chatHistory, currentChatId]);

    const isLoading = useMemo(() => {
        if (!currentChatId) return false;
        return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
    }, [chatHistory, currentChatId]);

    // Composed Logic
    const { handleFrontendToolExecution } = useToolHandler();
    const { processBackendStream } = useChatStream(chatHistoryHook, handleFrontendToolExecution, requestIdRef, abortControllerRef);

    // Test Resolver Logic
    useEffect(() => {
        if (!isLoading && testResolverRef.current && currentChatId) {
            const chat = chatHistory.find(c => c.id === currentChatId);
            if (chat && chat.messages.length > 0) {
                const lastMessage = chat.messages[chat.messages.length - 1];
                if (lastMessage.role === 'model') {
                    testResolverRef.current(lastMessage);
                    testResolverRef.current = null;
                }
            }
        }
    }, [isLoading, chatHistory, currentChatId]);

    // Actions
    const cancelGeneration = useCallback(() => {
        console.log('[DEBUG] Canceling generation...');
        abortControllerRef.current?.abort();
        
        if (requestIdRef.current) {
            console.log('[FRONTEND] Sending explicit cancel request to backend for requestId:', requestIdRef.current);
            fetchFromApi('/api/handler?task=cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: requestIdRef.current }),
            }).catch(error => console.error('[FRONTEND] Failed to send cancel request:', error));
            requestIdRef.current = null;
        }
        
        // Handle pending plan approval cancellation
        const chatId = currentChatIdRef.current;
        if (chatId) {
            const currentChat = chatHistoryRef.current.find(c => c.id === chatId);
            if (currentChat?.messages.length) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];
                if (lastMessage.executionState === 'pending_approval') {
                     const activeResponse = lastMessage.responses?.[lastMessage.activeResponseIndex];
                     const callId = activeResponse?.plan?.callId || 'plan-approval';
                     handleFrontendToolExecution(callId, 'denyExecution', false);
                }
            }
        }
    }, [handleFrontendToolExecution]);
    
    const approveExecution = useCallback((editedPlan: string) => {
        const chatId = currentChatIdRef.current;
        if (chatId) {
            const currentChat = chatHistoryRef.current.find(c => c.id === chatId);
            if (currentChat?.messages.length) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];
                const activeResponse = lastMessage.responses?.[lastMessage.activeResponseIndex];
                const callId = activeResponse?.plan?.callId || 'plan-approval';

                updateMessage(chatId, lastMessage.id, { executionState: 'approved' });
                handleFrontendToolExecution(callId, 'approveExecution', editedPlan);
            }
        }
    }, [updateMessage, handleFrontendToolExecution]);
  
    const denyExecution = useCallback(() => {
        const chatId = currentChatIdRef.current;
        if (chatId) {
            const currentChat = chatHistoryRef.current.find(c => c.id === chatId);
            if (currentChat?.messages.length) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];
                const activeResponse = lastMessage.responses?.[lastMessage.activeResponseIndex];
                const callId = activeResponse?.plan?.callId || 'plan-approval';

                updateMessage(chatId, lastMessage.id, { executionState: 'denied' });
                handleFrontendToolExecution(callId, 'denyExecution', false);
            }
        }
    }, [updateMessage, handleFrontendToolExecution]);

    const startBackendChat = async (
        chatId: string,
        messageId: string, 
        history: any[],
        chatConfig: Pick<ChatSession, 'model' | 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>,
        runtimeSettings: { isAgentMode: boolean } & ChatSettings
    ) => {
        abortControllerRef.current = new AbortController();
        console.log('[FRONTEND] Starting backend chat stream...');

        try {
            const response = await fetchFromApi('/api/handler?task=chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    chatId: chatId,
                    model: chatConfig.model,
                    history: history,
                    settings: {
                        isAgentMode: runtimeSettings.isAgentMode,
                        systemPrompt: runtimeSettings.systemPrompt,
                        temperature: chatConfig.temperature,
                        maxOutputTokens: chatConfig.maxOutputTokens || undefined,
                        imageModel: runtimeSettings.imageModel,
                        videoModel: runtimeSettings.videoModel,
                        memoryContent,
                    }
                }),
            });

            if (!response.ok || !response.body) throw new Error(await response.text() || `Request failed with status ${response.status}`);
            
            await processBackendStream(chatId, messageId, response);

        } catch (error) {
            if ((error as Error).message === 'Version mismatch') {
                console.log('[FRONTEND] Aborting chat due to version mismatch.');
            } else if ((error as Error).name !== 'AbortError') {
                console.error('[FRONTEND] Backend stream failed.', { error });
                chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error: parseApiError(error), endTime: Date.now() }));
            } else {
                console.log('[FRONTEND] Backend stream aborted.');
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
                
                const finalChatState = chatHistoryRef.current.find(c => c.id === chatId);
                if (finalChatState && apiKey) {
                    const suggestions = await generateFollowUpSuggestions(finalChatState.messages);
                     if (suggestions.length > 0) {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ suggestedActions: suggestions }));
                    }
                }
            } else {
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
            }
            abortControllerRef.current = null;
            requestIdRef.current = null;
        }
    };
    
    const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean; isThinkingModeEnabled?: boolean } = {}) => {
        if (isLoading) return;
        requestIdRef.current = null;
    
        let activeChatId = currentChatId;
        const currentChat = currentChatId ? chatHistory.find(c => c.id === currentChatId) : undefined;
        let messagesForHistory = currentChat ? currentChat.messages : [];

        if (!activeChatId || !currentChat) {
            const newChatSession = await chatHistoryHook.startNewChat(initialModel, {
                temperature: settings.temperature,
                maxOutputTokens: settings.maxOutputTokens,
                imageModel: settings.imageModel,
                videoModel: settings.videoModel,
            });
            if (!newChatSession) return;
            activeChatId = newChatSession.id;
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

    const sendMessageForTest = (userMessage: string, options?: { isThinkingModeEnabled?: boolean }): Promise<Message> => {
        return new Promise((resolve) => {
            testResolverRef.current = resolve;
            sendMessage(userMessage, undefined, options);
        });
    };

    const regenerateResponse = useCallback(async (aiMessageId: string) => {
        if (isLoading) cancelGeneration();
        if (!currentChatId) return;

        requestIdRef.current = null;
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (!currentChat) return;

        const messageIndex = currentChat.messages.findIndex(m => m.id === aiMessageId);
        if (messageIndex < 1 || currentChat.messages[messageIndex-1].role !== 'user') return;

        const userMessageToResend = currentChat.messages[messageIndex - 1];
        const historyUntilUserMessage = currentChat.messages.slice(0, messageIndex - 1);
        
        const newResponse: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
        chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponse);
        chatHistoryHook.setChatLoadingState(currentChatId, true);
        chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });

        const historyForApi = buildApiHistory([...historyUntilUserMessage, userMessageToResend]);
        await startBackendChat(currentChatId, aiMessageId, historyForApi, currentChat, { ...settings, isAgentMode: isAgentMode });

    }, [isLoading, currentChatId, chatHistory, cancelGeneration, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);

    // Auto-title generation
    useEffect(() => {
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (currentChat && currentChat.messages && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading && apiKey) {
          updateChatTitle(currentChatId!, "Generating title...");
          generateChatTitle(currentChat.messages)
            .then(newTitle => {
                const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
                updateChatTitle(currentChatId!, finalTitle);
            })
            .catch(err => updateChatTitle(currentChatId!, "Chat"));
        }
    }, [chatHistory, currentChatId, updateChatTitle, apiKey]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse, sendMessageForTest };
};
