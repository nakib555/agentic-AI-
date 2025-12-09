
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
    const { chatHistory, currentChatId, updateChatTitle, updateChatProperty } = chatHistoryHook;
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
            
            await sendToolResponse(callId, { result });

        } catch (error) {
            if ((error as Error).message === 'Version mismatch') return;

            const parsedError = parseApiError(error);
            console.error(`[FRONTEND] Tool '${toolName}' execution failed. Sending error to backend.`, { callId, error: parsedError });
            
            await sendToolResponse(callId, { error: parsedError.message });
        }
    }, [sendToolResponse]);


    const cancelGeneration = useCallback(() => {
        // Abort the frontend fetch immediately for responsiveness
        abortControllerRef.current?.abort();
        
        // Send the explicit cancel request to the backend fire-and-forget style
        if (requestIdRef.current) {
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
                    switch (event.type) {
                        case 'start':
                            if (event.payload?.requestId) {
                                requestIdRef.current = event.payload.requestId;
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
                    console.error("[FRONTEND] Failed to parse stream event:", line, e);
                }
            }
        }
    };
    
    const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean; isThinkingModeEnabled?: boolean } = {}) => {
        if (isLoading) {
            return;
        }
        
        requestIdRef.current = null; // Reset before new message
    
        let activeChatId = currentChatId;
        const currentChat = currentChatId ? chatHistory.find(c => c.id === currentChatId) : undefined;

        if (!activeChatId || !currentChat) {
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
        }
    
        const attachmentsData = files?.length ? await Promise.all(files.map(async f => ({ name: f.name, mimeType: f.type, data: await fileToBase64(f) }))) : undefined;
    
        const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden: options.isHidden, attachments: attachmentsData, activeResponseIndex: 0 };
        chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);
    
        const modelPlaceholder: Message = { id: generateId(), role: 'model', text: '', responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }], activeResponseIndex: 0, isThinking: true };
        chatHistoryHook.addMessagesToChat(activeChatId, [modelPlaceholder]);
        chatHistoryHook.setChatLoadingState(activeChatId, true);
    
        // WE NO LONGER BUILD HISTORY HERE.
        // We only send the new message content. The backend rebuilds history from DB.
        
        const chatForSettings = currentChat || { model: initialModel, ...settings };

        await startBackendChat(
            activeChatId, 
            modelPlaceholder.id, 
            userMessageObj, // Send only the new message object
            chatForSettings, 
            { ...settings, isAgentMode: options.isThinkingModeEnabled ?? isAgentMode }
        );
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

        requestIdRef.current = null; // Reset before new message

        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (!currentChat) return;

        const messageIndex = currentChat.messages.findIndex(m => m.id === aiMessageId);
        if (messageIndex < 1 || currentChat.messages[messageIndex-1].role !== 'user') {
            console.error("Cannot regenerate: AI message is not preceded by a user message.");
            return;
        }

        // When regenerating, we don't send a "newMessage". 
        // We rely on the backend to load history. 
        // IMPORTANT: The backend history will include the user message we are responding to, 
        // but it will also include the OLD model response we are regenerating. 
        // This is tricky. The backend logic currently blindly loads "messages". 
        
        // For simplicity in this heavy-lift refactor: 
        // We will send the full history for REGENERATION case only, or modify backend to support truncation.
        // Given the constraints, let's keep sending full history ONLY for regeneration to ensure correct context state
        // until backend supports "truncate at message ID".
        
        // Actually, the easiest fix for regeneration without heavy backend logic change is:
        // Pass the history explicitly like before, BUT only for regeneration.
        // OR: Update backend to handle `history` payload if present (fallback mode).
        
        // Let's use the fallback mode added to handler.ts.
        // We construct history up to the user message.
        
        const userMessageToResend = currentChat.messages[messageIndex - 1];
        const historyUntilUserMessage = currentChat.messages.slice(0, messageIndex - 1);
        
        const newResponse: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
        chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponse);
        chatHistoryHook.setChatLoadingState(currentChatId, true);
        chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });

        // We temporarily import the builder just for this edge case or reconstruct it manually?
        // Let's reconstruct manually to avoid circular dependency or re-adding the file we deleted.
        // Actually, we can just send the array of messages and let backend transform it if we change the API to accept Message[] for history fallback.
        // But backend expects Content[].
        
        // Since we removed history-builder.ts, we need to let backend handle this.
        // We will send `newMessage: null` but provide `history` in the body.
        // But wait, the backend `transformHistoryToGeminiFormat` is available on backend.
        
        // Best approach: Send the `newMessage` as the user message we are regenerating for.
        // But we need to tell backend to IGNORE the last X messages in DB (the old response).
        // This is getting complex.
        
        // Simple Fix: For regeneration, we just rely on the fact that `newMessage` is appended.
        // If we treat the "user message to resend" as a "new message", the backend will append it to the END of the DB history.
        // But the DB history already contains that user message + old AI response.
        // This would duplicate the user message.
        
        // Solution: Do not support regeneration in this specific refactor step without a larger backend API change (e.g., /api/chat/regenerate).
        // OR: Send the `history` array manually constructed here.
        // Since I removed `history-builder.ts`, I will add a minimal local builder here for regeneration fallback.
        
        const buildLocalHistory = (msgs: Message[]) => {
             return msgs.filter(m => !m.isHidden).map(m => {
                 if (m.role === 'user') return { role: 'user', parts: [{ text: m.text }] };
                 const resp = m.responses?.[m.activeResponseIndex];
                 return { role: 'model', parts: [{ text: resp?.text || '' }] };
             });
        };
        
        // Construct history excluding the AI response we are replacing AND the user message (since we will send it as newMessage)
        const historyForApi = buildLocalHistory(historyUntilUserMessage);

        await startBackendChat(
            currentChatId, 
            aiMessageId, 
            userMessageToResend, // Send this as "new"
            currentChat, 
            { ...settings, isAgentMode: isAgentMode },
            historyForApi // Override backend history fetching
        );

    }, [isLoading, currentChatId, chatHistory, cancelGeneration, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);

    const startBackendChat = async (
        chatId: string,
        messageId: string, // The ID of the model message to update
        newMessage: Message, // The new user message
        chatConfig: Pick<ChatSession, 'model' | 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>,
        runtimeSettings: { isAgentMode: boolean } & ChatSettings,
        overrideHistory?: any[] // Optional: If provided, backend uses this instead of DB
    ) => {
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetchFromApi('/api/handler?task=chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    chatId: chatId,
                    model: chatConfig.model,
                    newMessage: newMessage, // Send message object
                    history: overrideHistory, // Optional override
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
                // Handled globally
            } else if ((error as Error).name !== 'AbortError') {
                console.error('[FRONTEND] Backend stream failed.', { error });
                chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error: parseApiError(error), endTime: Date.now() }));
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                chatHistoryHook.updateMessage(chatId, messageId, { isThinking: false });
                chatHistoryHook.completeChatLoading(chatId);
                abortControllerRef.current = null;
                requestIdRef.current = null;
                
                // Fetch suggestions only if API key present
                const finalChatState = chatHistoryRef.current.find(c => c.id === chatId);
                if (finalChatState && apiKey) {
                    const suggestions = await generateFollowUpSuggestions(finalChatState.messages);
                     if (suggestions.length > 0) {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ suggestedActions: suggestions }));
                    }
                }

                // Force sync state
                setTimeout(() => {
                    const chatToPersist = chatHistoryRef.current.find(c => c.id === chatId);
                    if (chatToPersist) {
                        const cleanMessages = chatToPersist.messages.map(m => 
                            m.id === messageId ? { ...m, isThinking: false } : m
                        );
                        updateChatProperty(chatId, { messages: cleanMessages });
                    }
                }, 100);

            } else {
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
