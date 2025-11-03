/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Part } from "@google/genai";
import { type Message } from '../../types';
import { parseMessageText } from '../../utils/messageParser';

type ApiHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

export const buildApiHistory = (messages: Message[]): ApiHistory => {
    const historyForApi: ApiHistory = [];
    messages.forEach((msg: Message) => {
        if (msg.isHidden) return;

        if (msg.role === 'user') {
            const parts: Part[] = [];
            if (msg.text) parts.push({ text: msg.text });
            if (msg.attachments) {
                msg.attachments.forEach(att => parts.push({
                    inlineData: { mimeType: att.mimeType, data: att.data }
                }));
            }
            if (parts.length > 0) {
                historyForApi.push({ role: 'user', parts });
            }
        } else if (msg.role === 'model') {
            const activeResponse = msg.responses?.[msg.activeResponseIndex];
            if (!activeResponse) return;

            const { finalAnswerText } = parseMessageText(activeResponse.text, false, !!activeResponse.error);
            const modelParts: Part[] = [];
            const functionResponseParts: Part[] = [];

            if (finalAnswerText) {
                modelParts.push({ text: finalAnswerText });
            }

            if (activeResponse.toolCallEvents) {
                activeResponse.toolCallEvents.forEach(event => {
                    // Only push the function call if it hasn't been responded to yet.
                    if (event.result === undefined) {
                        modelParts.push({ functionCall: event.call });
                    }
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
    return historyForApi;
};
