
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamCallbacks } from '../../services/agenticLoop/stream-processor';
import { parseAgenticWorkflow } from '../../utils/workflowParsing';
import { parseApiError } from '../../services/gemini/apiError';
import type { BrowserSession } from '../../types';

type CallbacksConfig = {
    chatId: string;
    messageId: string;
    updateActiveResponseOnMessage: (chatId: string, messageId: string, updateFn: (r: any) => any) => void;
    updateMessage: (chatId: string, messageId: string, update: any) => void;
    completeChatLoading: (chatId: string) => void;
    handleFrontendToolExecution: (callId: string, toolName: string, toolArgs: any) => void;
    onStart?: (requestId: string) => void;
    onCancel?: () => void;
};

export const createStreamCallbacks = (config: CallbacksConfig): StreamCallbacks => {
    const { 
        chatId, 
        messageId, 
        updateActiveResponseOnMessage, 
        updateMessage, 
        completeChatLoading, 
        handleFrontendToolExecution,
        onStart 
    } = config;

    return {
        onStart: (requestId) => {
            if (onStart) onStart(requestId);
        },
        onTextChunk: (delta) => {
            updateActiveResponseOnMessage(chatId, messageId, (current) => {
                const newText = (current.text || '') + delta;
                const parsedWorkflow = parseAgenticWorkflow(newText, current.toolCallEvents || [], false);
                return { text: newText, workflow: parsedWorkflow };
            });
        },
        onWorkflowUpdate: () => {},
        onToolCallStart: (toolCallEvents) => {
            // Unify logic: Filter out existing events if any, to prevent duplicates during potential reconnections
            // or just append new ones.
            updateActiveResponseOnMessage(chatId, messageId, (r) => {
                const existingIds = new Set((r.toolCallEvents || []).map((e: any) => e.id));
                const newEvents = toolCallEvents
                    .filter((e: any) => !existingIds.has(e.id))
                    .map((e: any) => ({
                        ...e,
                        startTime: e.startTime || Date.now()
                    }));
                
                const updatedEvents = [...(r.toolCallEvents || []), ...newEvents];
                const parsedWorkflow = parseAgenticWorkflow(r.text || '', updatedEvents, false);
                return { toolCallEvents: updatedEvents, workflow: parsedWorkflow };
            });
        },
        onToolUpdate: (payload) => {
            updateActiveResponseOnMessage(chatId, messageId, (r) => {
                const updatedEvents = r.toolCallEvents?.map((tc: any) => {
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
                return { toolCallEvents: updatedEvents };
            });
        },
        onToolCallEnd: (payload) => {
            updateActiveResponseOnMessage(chatId, messageId, (r) => {
                const updatedEvents = r.toolCallEvents?.map((tc: any) => tc.id === payload.id ? { ...tc, result: payload.result, endTime: Date.now() } : tc);
                const parsedWorkflow = parseAgenticWorkflow(r.text || '', updatedEvents || [], false);
                return { toolCallEvents: updatedEvents, workflow: parsedWorkflow };
            });
        },
        onPlanReady: (plan) => {
            const payload = plan as any; 
            updateActiveResponseOnMessage(chatId, messageId, () => ({ plan: payload }));
            updateMessage(chatId, messageId, { executionState: 'pending_approval' });
        },
        onFrontendToolRequest: (callId, toolName, toolArgs) => {
            handleFrontendToolExecution(callId, toolName, toolArgs);
        },
        onComplete: (payload) => {
            updateActiveResponseOnMessage(chatId, messageId, (r) => {
                const finalWorkflow = parseAgenticWorkflow(payload.finalText, r.toolCallEvents || [], true);
                return { 
                    text: payload.finalText, 
                    endTime: Date.now(), 
                    groundingMetadata: payload.groundingMetadata,
                    workflow: finalWorkflow 
                };
            });
            // Note: We don't set isThinking: false here because the parent logic usually handles final cleanup
            // in the 'finally' block or after the stream closes, to ensure UI state consistency.
        },
        onError: (error) => {
            updateActiveResponseOnMessage(chatId, messageId, () => ({ error: parseApiError(error), endTime: Date.now() }));
        },
        onCancel: () => {
            if (config.onCancel) {
                config.onCancel();
            } else {
                updateMessage(chatId, messageId, { isThinking: false });
                completeChatLoading(chatId);
            }
        }
    };
};
