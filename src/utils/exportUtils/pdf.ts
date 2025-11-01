/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 3 of 3 from src/utils/exportUtils.ts
// Contains logic for PDF export.

import type { ChatSession } from '../../types';
import { parseMessageText } from '../messageParser';

export const exportChatToPdf = (chat: ChatSession) => {
    const markdownToHtml = (text: string): string => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
    };

    let messagesHtml = '';
    for (const message of chat.messages) {
        if (message.isHidden) continue;
        const role = message.role;
        const { finalAnswerText } = parseMessageText(message.text, false, !!message.error);
        const textToRender = role === 'user' ? message.text : finalAnswerText;
        
        messagesHtml += `<div class="message ${role}"><div class="bubble"><div class="author">${role === 'user' ? 'You' : 'AI'}</div>${markdownToHtml(textToRender)}</div></div>`;
    }

    const htmlContent = `
        <!DOCTYPE html><html><head><title>Chat Export: ${chat.title}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; line-height: 1.6; } h1 { font-size: 1.5rem; }
                .message { margin-bottom: 1.5rem; display: flex; } .user { justify-content: flex-end; }
                .model { justify-content: flex-start; } .bubble { max-width: 80%; padding: 10px 15px; border-radius: 18px; }
                .user .bubble { background-color: #007aff; color: white; border-bottom-right-radius: 4px; }
                .model .bubble { background-color: #e5e5ea; color: black; border-bottom-left-radius: 4px; }
                .author { font-weight: bold; margin-bottom: 5px; font-size: 0.8rem; }
                pre { background-color: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; }
            </style>
        </head><body><h1>Chat: ${chat.title}</h1><p><strong>Model:</strong> ${chat.model}</p><hr style="margin: 20px 0;">
            ${messagesHtml}
            <script>window.onload = () => window.print();</script>
        </body></html>
    `;

    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } else {
        alert('Could not open a new window. Please disable your pop-up blocker and try again.');
    }
};
