
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
import { processBackendStream } from '../../services/agenticLoop/stream-processor';
import { parseAgenticWorkflow } from '../../utils/workflowParsing';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    aboutUser?: string;
    aboutResponse?: string;
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChat = (
    initialModel: string, 
    settings: ChatSettings, 
    memoryContent: string, 
    isAgentMode: boolean, 
    apiKey: string,
    onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void
) => {
    const chatHistoryHook = useChatHistory();
    const { chatHistory, currentChatId, updateChatTitle, updateChatProperty } = chatHistoryHook;
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef<string | null>(null); // For explicit cancellation
    const testResolverRef = useRef<((value: Message | PromiseLike<Message>) => void) | null>(null);
    
    // Track title generation attempts to prevent loops
    const titleGenerationAttemptedRef = useRef<Set<string>>(new Set());


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

    const startBackendChat = async (
        task: 'chat' | 'regenerate',
        chatId: string,
        messageId: string, // The ID of the model message to update
        newMessage: Message | null, // The new user message (null for regenerate)
        chatConfig: Pick<ChatSession, 'model' | 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>,
        runtimeSettings: { isAgentMode: boolean } & ChatSettings
    ) => {
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetchFromApi(`/api/handler?task=${task}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    chatId: chatId,
                    messageId: messageId,
                    model: chatConfig.model,
                    newMessage: newMessage, // Send message object or null
                    settings: {
                        isAgentMode: runtimeSettings.isAgentMode,
                        systemPrompt: runtimeSettings.systemPrompt,
                        aboutUser: runtimeSettings.aboutUser,
                        aboutResponse: runtimeSettings.aboutResponse,
                        temperature: chatConfig.temperature,
                        maxOutputTokens: chatConfig.maxOutputTokens || undefined,
                        imageModel: runtimeSettings.imageModel,
                        videoModel: runtimeSettings.videoModel,
                        memoryContent,
                    }
                }),
            });

            if (!response.ok || !response.body) throw new Error(await response.text() || `Request failed with status ${response.status}`);
            
            // Delegate to the stream processor service
            await processBackendStream(
                response,
                {
                    onStart: (requestId) => {
                        requestIdRef.current = requestId;
                    },
                    onTextChunk: (delta) => {
                        // Append delta to current text
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (current) => {
                            const newText = (current.text || '') + delta;
                            // Client-side workflow parsing
                            const parsedWorkflow = parseAgenticWorkflow(newText, current.toolCallEvents || [], false);
                            return { text: newText, workflow: parsedWorkflow };
                        });
                    },
                    onWorkflowUpdate: () => {
                        // Deprecated: Workflow is now computed client-side in onTextChunk/onTool*
                    },
                    onToolCallStart: (toolCallEvents) => {
                        const newEvents = toolCallEvents.map((toolEvent: any) => ({
                            id: toolEvent.id,
                            call: toolEvent.call,
                            startTime: Date.now()
                        }));
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => {
                            const updatedEvents = [...(r.toolCallEvents || []), ...newEvents];
                            const parsedWorkflow = parseAgenticWorkflow(r.text || '', updatedEvents, false);
                            return { toolCallEvents: updatedEvents, workflow: parsedWorkflow };
                        });
                    },
                    onToolUpdate: (payload) => {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => {
                            const updatedEvents = r.toolCallEvents?.map(tc => {
                                if (tc.id === payload.id) {
                                    const session = (tc.browserSession || { url: payload.url || '', logs: [], status: 'running' }) as BrowserSession;
                                    if (payload.log) session.logs = [...session.logs, payload.log];
                                    if (payload.screenshot) session.screenshot = payload.screenshot;
                                    if (payload.title) session.title = payload.title;
                                    if (payload.url) session.url = payload.url;
                                    if (payload.status) session.status = payload.status;
                                    return { ...tc, browserSession: { ...session } };
                                }
                                return tc;
                            });
                            const parsedWorkflow = parseAgenticWorkflow(r.text || '', updatedEvents || [], false);
                            return { toolCallEvents: updatedEvents, workflow: parsedWorkflow };
                        });
                    },
                    onToolCallEnd: (payload) => {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => {
                            const updatedEvents = r.toolCallEvents?.map(tc => tc.id === payload.id ? { ...tc, result: payload.result, endTime: Date.now() } : tc);
                            const parsedWorkflow = parseAgenticWorkflow(r.text || '', updatedEvents || [], false);
                            return { toolCallEvents: updatedEvents, workflow: parsedWorkflow };
                        });
                    },
                    onPlanReady: (plan) => {
                        const payload = plan as any; 
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ plan: payload }));
                        chatHistoryHook.updateMessage(chatId, messageId, { executionState: 'pending_approval' });
                    },
                    onFrontendToolRequest: (callId, toolName, toolArgs) => {
                        handleFrontendToolExecution(callId, toolName, toolArgs);
                    },
                    onComplete: (payload) => {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, (r) => {
                            const finalWorkflow = parseAgenticWorkflow(payload.finalText, r.toolCallEvents || [], true);
                            return { 
                                text: payload.finalText, 
                                endTime: Date.now(), 
                                groundingMetadata: payload.groundingMetadata,
                                workflow: finalWorkflow 
                            };
                        });
                    },
                    onError: (error) => {
                        chatHistoryHook.updateActiveResponseOnMessage(chatId, messageId, () => ({ error, endTime: Date.now() }));
                    },
                    onCancel: () => {
                        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                            abortControllerRef.current.abort();
                        }
                    }
                },
                abortControllerRef.current.signal
            );

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
                
                const finalChatState = chatHistoryRef.current.find(c => c.id === chatId);
                
                // --- POST-STREAMING OPERATIONS ---
                
                if (finalChatState && apiKey) {
                    // 1. Generate Title (Only for new chats, only once, only after stream complete)
                    if (finalChatState.title === "New Chat" && finalChatState.messages.length >= 2 && !titleGenerationAttemptedRef.current.has(chatId)) {
                        titleGenerationAttemptedRef.current.add(chatId);
                        
                        generateChatTitle(finalChatState.messages)
                            .then(newTitle => {
                                const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
                                updateChatTitle(chatId, finalTitle);
                            })
                            .catch(err => console.error("Failed to generate chat title:", err));
                    }

                    // 2. Generate Suggestions
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
    
    const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean; isThinkingModeEnabled?: boolean } = {}) => {
        if (isLoading) {
            return;
        }
        
        requestIdRef.current = null; // Reset before new message
    
        // Use Refs for latest state to avoid closure staleness issues
        const currentHistory = chatHistoryRef.current;
        const activeChatIdFromRef = currentChatIdRef.current;
        
        let activeChatId = activeChatIdFromRef;
        const currentChat = activeChatId ? currentHistory.find(c => c.id === activeChatId) : undefined;

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
    
        const chatForSettings = currentChat || { model: initialModel, ...settings };

        // Use 'chat' task for new messages
        await startBackendChat(
            'chat',
            activeChatId, 
            modelPlaceholder.id, 
            userMessageObj,
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
        
        // Add new response entry
        const newResponse: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
        chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponse);
        chatHistoryHook.setChatLoadingState(currentChatId, true);
        chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });

        // Use 'regenerate' task
        await startBackendChat(
            'regenerate',
            currentChatId, 
            aiMessageId, 
            null, // No new user message
            currentChat, 
            { ...settings, isAgentMode: isAgentMode }
        );

    }, [isLoading, currentChatId, chatHistory, cancelGeneration, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);
    
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse, sendMessageForTest };
};
