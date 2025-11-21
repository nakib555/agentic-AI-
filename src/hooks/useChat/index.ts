
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { type Message, type ChatSession, ModelResponse, BrowserSession } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { generateChatTitle, parseApiError, generateFollowUpSuggestions } from '../../services/gemini/index';
import { fetchFromApi } from '../../utils/api';
import { toolImplementations as frontendToolImplementations } from '../../tools';
import { buildApiHistory } from './history-builder';

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
    const { chatHistory, currentChatId, updateChatTitle } = chatHistoryHook;
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef<string | null>(null); // For explicit cancellation
    const testResolverRef = useRef<((value: Message | PromiseLike<Message>) => void) | null>(null);


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

    // Effect to resolve test promise when loading completes
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

    // Helper to send tool response with robust retry logic
    const sendToolResponse = useCallback(async (callId: string, payload: any) => {
        let attempts = 0;
        const maxAttempts = 4; // Increased attempts
        const baseDelay = 1000;

        while (attempts < maxAttempts) {
            try {
                const response = await fetchFromApi('/api/handler?task=tool_response', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId, ...payload }),
                });

                if (response.ok) return;

                // If server says 404, the session is likely gone (server restart). 
                // Retrying won't help, so we abort to prevent infinite loops.
                if (response.status === 404) {
                    console.warn(`[FRONTEND] Backend session lost (404) for tool response ${callId}. Stopping retries.`);
                    return;
                }
                
                throw new Error(`Backend returned status ${response.status}`);
            } catch (e) {
                const err = e as Error;
                // If global version mismatch handler triggered, stop everything
                if (err.message === 'Version mismatch') throw err;

                attempts++;
                console.warn(`[FRONTEND] Tool response fetch failed (Attempt ${attempts}/${maxAttempts}): ${err.message}`);
                
                if (attempts >= maxAttempts) {
                    console.error(`[FRONTEND] Giving up on sending tool response for ${callId} after ${maxAttempts} attempts.`);
                    // We don't throw here to avoid crashing the whole UI, just log the failure
                    return;
                }
                
                // Exponential backoff with jitter: 1s, 2s, 4s... + random jitter
                const delay = baseDelay * Math.pow(2, attempts - 1) + (Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, []);

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
            console.log(`[FRONTEND] Tool '${toolName}' executed successfully. Sending result to backend.`, { callId });
            
            await sendToolResponse(callId, { result });

        } catch (error) {
            if ((error as Error).message === 'Version mismatch') return;

            const parsedError = parseApiError(error);
            console.error(`[FRONTEND] Tool '${toolName}' execution failed. Sending error to backend.`, { callId, error: parsedError });
            
            await sendToolResponse(callId, { error: parsedError.message });
        }
    }, [sendToolResponse]);


    const cancelGeneration = useCallback(() => {
        console.log('[DEBUG] Canceling generation...');
        // Abort the frontend fetch immediately for responsiveness
        abortControllerRef.current?.abort();
        
        // Send the explicit cancel request to the backend fire-and-forget style
        if (requestIdRef.current) {
            console.log('[FRONTEND] Sending explicit cancel request to backend for requestId:', requestIdRef.current);
            fetchFromApi('/api/handler?task=cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: requestIdRef.current }),
            }).catch(error => console.error('[FRONTEND] Failed to send cancel request:', error));
            requestIdRef.current = null;
        }
        
        // Fallback for plan approval state cancellation if we are stuck there
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
    
    const { updateMessage } = chatHistoryHook;
    
    const approveExecution = useCallback((editedPlan: string) => {
        console.log('[DEBUG] Execution approved.');
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
        console.log('[DEBUG] Execution denied.');
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


    const processBackendStream = async (chatId: string, messageId: string, response: Response) => {
        console.log('[DEBUG] Processing backend stream...'); // LOG
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
                    if (event.type !== 'ping') { // Don't log pings to avoid clutter
                        // console.log('[FRONTEND] Received stream event:', event); // LOG - commented out to reduce noise from tool updates
                    }
                    switch (event.type) {
                        case 'start':
                            if (event.payload?.requestId) {
                                requestIdRef.current = event.payload.requestId;
                                console.log('[FRONTEND] Received requestId from backend:', requestIdRef.current);
                            }
                            break;
                        case 'ping':
                            break;
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
                        case 'tool-update':
                            // Handle real-time tool updates (browser logs, etc.)
                            chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => ({
                                toolCallEvents: r.toolCallEvents?.map(tc => {
                                    if (tc.id === event.payload.id) {
                                        const session = (tc.browserSession || { url: event.payload.url || '', logs: [], status: 'running' }) as BrowserSession;
                                        
                                        // Merge updates
                                        if (event.payload.log) session.logs = [...session.logs, event.payload.log];
                                        if (event.payload.screenshot) session.screenshot = event.payload.screenshot;
                                        if (event.payload.title) session.title = event.payload.title;
                                        if (event.payload.url) session.url = event.payload.url;
                                        if (event.payload.status) session.status = event.payload.status;

                                        return { ...tc, browserSession: { ...session } }; // Create new object reference
                                    }
                                    return tc;
                                })
                            }));
                            break;
                        case 'tool-call-end':
                             chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => ({
                                toolCallEvents: r.toolCallEvents?.map(tc => tc.id === event.payload.id ? { ...tc, result: event.payload.result, endTime: Date.now() } : tc)
                            }));
                            break;
                        case 'plan-ready':
                            // Payload is { plan: string, callId: string }
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
                        case 'cancel':
                            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                                abortControllerRef.current.abort();
                            }
                            break;
                    }
                } catch(e) {
                    console.error("[FRONTEND] Failed to parse stream event:", line, e); // LOG
                }
            }
        }
    };
    
    const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean; isThinkingModeEnabled?: boolean } = {}) => {
        console.log('[FRONTEND] sendMessage called.', { userMessage, files: files?.map(f => f.name), options }); // LOG
        if (isLoading) {
            console.log('[FRONTEND] sendMessage ignored, a request is already in progress.'); // LOG
            return;
        }
        
        requestIdRef.current = null; // Reset before new message
    
        let activeChatId = currentChatId;
        const currentChat = currentChatId ? chatHistory.find(c => c.id === currentChatId) : undefined;
        let messagesForHistory = currentChat ? currentChat.messages : [];

        if (!activeChatId || !currentChat) {
            console.log('[DEBUG] No active chat, creating new session...'); // LOG
            const newChatSession = await chatHistoryHook.startNewChat(initialModel, {
                temperature: settings.temperature,
                maxOutputTokens: settings.maxOutputTokens,
                imageModel: settings.imageModel,
                videoModel: settings.videoModel,
            });
            if (!newChatSession) {
                console.error("Failed to start a new chat, aborting message send.");
                return;
            }
            activeChatId = newChatSession.id;
            console.log('[DEBUG] New chat created:', activeChatId); // LOG
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

        console.log('[DEBUG] Starting backend chat...', { activeChatId, modelPlaceholderId: modelPlaceholder.id }); // LOG
        await startBackendChat(activeChatId, modelPlaceholder.id, historyForApi, chatForSettings, { ...settings, isAgentMode: options.isThinkingModeEnabled ?? isAgentMode });
    };

    const sendMessageForTest = (userMessage: string, options?: { isThinkingModeEnabled?: boolean }): Promise<Message> => {
        return new Promise((resolve) => {
            testResolverRef.current = resolve;
            sendMessage(userMessage, undefined, options);
        });
    };

    const regenerateResponse = useCallback(async (aiMessageId: string) => {
        console.log(`[FRONTEND] regenerateResponse called for messageId: ${aiMessageId}`);
        if (isLoading) cancelGeneration();
        if (!currentChatId) return;

        requestIdRef.current = null; // Reset before new message

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
        console.log('[FRONTEND] Starting backend chat stream...', { chatId, messageId, historyLength: history.length, chatConfig, runtimeSettings }); // LOG

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
                        // Ensure maxOutputTokens is undefined if it's 0, as the API rejects 0.
                        maxOutputTokens: chatConfig.maxOutputTokens || undefined,
                        imageModel: runtimeSettings.imageModel,
                        videoModel: runtimeSettings.videoModel,
                        memoryContent,
                    }
                }),
            });

            if (!response.ok || !response.body) throw new Error(await response.text() || `Request failed with status ${response.status}`);
            
            console.log('[FRONTEND] Backend stream connected.'); // LOG
            await processBackendStream(chatId, messageId, response);
            console.log('[FRONTEND] Backend stream finished processing.'); // LOG

        } catch (error) {
            if ((error as Error).message === 'Version mismatch') {
                // Do not log or update message with error; let the global overlay handle it.
                console.log('[FRONTEND] Aborting chat due to version mismatch.');
            } else if ((error as Error).name !== 'AbortError') {
                console.error('[FRONTEND] Backend stream failed.', { error }); // LOG
                chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error: parseApiError(error), endTime: Date.now() }));
            } else {
                console.log('[FRONTEND] Backend stream aborted.'); // LOG
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                console.log('[FRONTEND] Finalizing chat turn.'); // LOG
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
                abortControllerRef.current = null;
                requestIdRef.current = null;
                
                const finalChatState = chatHistoryRef.current.find(c => c.id === chatId);
                // Guard: Only request suggestions if API key is configured
                if (finalChatState && apiKey) {
                    const suggestions = await generateFollowUpSuggestions(finalChatState.messages);
                     if (suggestions.length > 0) {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ suggestedActions: suggestions }));
                    }
                }
            } else {
                // If aborted, ensure loading state is false
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
                abortControllerRef.current = null;
                requestIdRef.current = null;
            }
        }
    };
    
    // Auto-title generation
    useEffect(() => {
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (currentChat && currentChat.messages && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
          // Guard: Don't attempt title generation without API key
          if (!apiKey) return;

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
    }, [chatHistory, currentChatId, updateChatTitle, apiKey]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse, sendMessageForTest };
};
