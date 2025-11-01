/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Correct relative import path for types.
import type { ChatSession } from '../types';
import { parseMessageText } from './messageParser';

const sanitizeFilename = (title: string): string => {
  return title.replace(/[^a-z0-9-_]/gi, '_').substring(0, 50) || 'chat';
};

const getChatAsMarkdown = (chat: ChatSession): string => {
    let markdownContent = `# Chat: ${chat.title}\n\n`;
    markdownContent += `**Model:** ${chat.model}\n`;
    markdownContent += `**Exported on:** ${new Date().toLocaleString()}\n\n---\n\n`;

    for (const message of chat.messages) {
        if (message.isHidden) continue;

        if (message.role === 'user') {
            markdownContent += `**You:**\n`;
            if (message.attachments && message.attachments.length > 0) {
                markdownContent += `*Attached ${message.attachments.length} file(s): ${message.attachments.map(a => a.name).join(', ')}*\n\n`;
            }
            markdownContent += `${message.text}\n\n`;
        } else if (message.role === 'model') {
            markdownContent += `**AI:**\n`;
            const { thinkingText, finalAnswerText } = parseMessageText(message.text, false, !!message.error);

            if (thinkingText) {
                markdownContent += `<details>\n`;
                markdownContent += `<summary>View thought process</summary>\n\n`;
                markdownContent += `\`\`\`\n${thinkingText.trim()}\n\`\`\`\n`;
                markdownContent += `</details>\n\n`;
            }

            let answer = finalAnswerText;
            // Replace component tags with placeholders
            answer = answer.replace(/\[IMAGE_COMPONENT\](.*?)\[\/IMAGE_COMPONENT\]/gs, (match, jsonStr) => {
                try {
                    const data = JSON.parse(jsonStr);
                    return `\n*[Image generated with caption: "${data.caption}"]*\n`;
                } catch {
                    return '\n*[Image generated]*\n';
                }
            });
            answer = answer.replace(/\[VIDEO_COMPONENT\](.*?)\[\/VIDEO_COMPONENT\]/gs, (match, jsonStr) => {
                try {
                    const data = JSON.parse(jsonStr);
                    return `\n*[Video generated with prompt: "${data.prompt}"]*\n`;
                } catch {
                    return '\n*[Video generated]*\n';
                }
            });
            answer = answer.replace(/\[MAP_COMPONENT\](.*?)\[\/MAP_COMPONENT\]/gs, (match, jsonStr) => {
                try {
                    const data = JSON.parse(jsonStr);
                    return `\n*[Map displayed for location: lat ${data.latitude}, lon ${data.longitude}]*\n`;
                } catch {
                    return '\n*[Map displayed]*\n';
                }
            });
            answer = answer.replace(/\[FILE_ATTACHMENT_COMPONENT\](.*?)\[\/FILE_ATTACHMENT_COMPONENT\]/gs, (match, jsonStr) => {
                try {
                    const data = JSON.parse(jsonStr);
                    return `\n*[File attached: ${data.filename}]*\n`;
                } catch {
                    return '\n*[File attached]*\n';
                }
            });
            answer = answer.replace(/\[MCQ_COMPONENT\](.*?)\[\/MCQ_COMPONENT\]/gs, '\n*[Multiple choice question presented]*\n');


            if (answer) {
                markdownContent += `${answer}\n\n`;
            }
            
            if (message.error) {
                markdownContent += `**Error:** ${message.error.message}\n\n`;
            }
        }
    }
    return markdownContent;
};

export const exportChatToMarkdown = (chat: ChatSession) => {
  const markdownContent = getChatAsMarkdown(chat);
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(chat.title)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportChatToClipboard = (chat: ChatSession) => {
    const markdownContent = getChatAsMarkdown(chat);
    navigator.clipboard.writeText(markdownContent).then(() => {
        alert('Chat content copied to clipboard as Markdown!');
    }, (err) => {
        console.error('Failed to copy chat to clipboard: ', err);
        alert('Could not copy chat to clipboard. See console for details.');
    });
};

export const exportChatToJson = (chat: ChatSession) => {
    const jsonContent = JSON.stringify(chat, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(chat.title)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportChatToPdf = (chat: ChatSession) => {
    const markdownToHtml = (text: string): string => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => `<pre><code>${code.trim()}</code></pre>`)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    };

    let messagesHtml = '';
    for (const message of chat.messages) {
        if (message.isHidden) continue;
        const role = message.role;
        const { finalAnswerText } = parseMessageText(message.text, false, !!message.error);
        const textToRender = role === 'user' ? message.text : finalAnswerText;
        
        messagesHtml += `
            <div class="message ${role}">
                <div class="bubble">
                    <div class="author">${role === 'user' ? 'You' : 'AI'}</div>
                    ${markdownToHtml(textToRender)}
                </div>
            </div>
        `;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Chat Export: ${chat.title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { font-size: 1.5rem; }
                .message { margin-bottom: 1.5rem; display: flex; }
                .user { justify-content: flex-end; }
                .model { justify-content: flex-start; }
                .bubble { max-width: 80%; padding: 10px 15px; border-radius: 18px; }
                .user .bubble { background-color: #007aff; color: white; border-bottom-right-radius: 4px; }
                .model .bubble { background-color: #e5e5ea; color: black; border-bottom-left-radius: 4px; }
                .author { font-weight: bold; margin-bottom: 5px; font-size: 0.8rem; }
                pre { background-color: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; }
                code { font-family: monospace; }
            </style>
        </head>
        <body>
            <h1>Chat: ${chat.title}</h1>
            <p><strong>Model:</strong> ${chat.model}</p>
            <hr style="margin: 20px 0;">
            ${messagesHtml}
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } else {
        alert('Could not open a new window. Please disable your pop-up blocker and try again.');
    }
};