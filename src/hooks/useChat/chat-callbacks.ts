
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamCallbacks } from '../../services/agenticLoop/stream-processor';
import { parseAgenticWorkflow } from '../../utils/workflowParsing';
import { parseApiError } from '../../services/gemini/apiError';

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
        onStart 
    } = config;

    return {
        onStart: (requestId) => {
            if (onStart) onStart(requestId);
        },
        onTextChunk: (delta) => {
            updateActiveResponseOnMessage(chatId, messageId, (current) => {
                const newText = (current.text || '') + delta;
                return { text: newText };
            });
        },
        onWorkflowUpdate: () => {},
        onToolCallStart: () => {},
        onToolUpdate: () => {},
        onToolCallEnd: () => {},
        onPlanReady: () => {},
        onFrontendToolRequest: () => {},
        onComplete: (payload) => {
            updateActiveResponseOnMessage(chatId, messageId, (r) => {
                return { 
                    text: payload.finalText, 
                    endTime: Date.now(), 
                    groundingMetadata: payload.groundingMetadata
                };
            });
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
