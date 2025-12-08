
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useChatHistory } from '../useChatHistory';
import { BrowserSession } from '../../types';

export const useChatStream = (
    chatHistoryHook: ReturnType<typeof useChatHistory>,
    handleFrontendToolExecution: (callId: string, toolName: string, toolArgs: any) => Promise<void>,
    requestIdRef: React.MutableRefObject<string | null>,
    abortControllerRef: React.MutableRefObject<AbortController | null>
) => {
    const processBackendStream = useCallback(async (chatId: string, messageId: string, response: Response) => {
        console.log('[DEBUG] Processing backend stream...');
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
                    console.error("[FRONTEND] Failed to parse stream event:", line, e);
                }
            }
        }
    }, [chatHistoryHook, handleFrontendToolExecution, requestIdRef, abortControllerRef]);

    return { processBackendStream };
};