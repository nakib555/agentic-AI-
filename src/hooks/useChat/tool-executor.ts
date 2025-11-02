/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 3 of 4 from src/hooks/useChat.ts
// Contains the wrapper for executing tools.

import { toolImplementations } from '../../tools';
import { ToolError } from '../../types';

const base64ToUint8Array = (base64: string) => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

export const createToolExecutor = (chatHistory: any[], activeChatId: string) => {
    return async (name: string, args: any): Promise<string> => {
        const toolImplementation = toolImplementations[name];
        if (!toolImplementation) {
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" not found.`);
        }

        let finalArgs = { ...args };
        if (name === 'executeCode' && finalArgs.input_filenames && Array.isArray(finalArgs.input_filenames)) {
            const currentChat = chatHistory.find(c => c.id === activeChatId);
            const lastUserMessage = currentChat?.messages.filter((m: any) => m.role === 'user' && !m.isHidden).pop();

            if (lastUserMessage?.attachments) {
                const attachmentsToLoad = lastUserMessage.attachments.filter(
                    (att: any) => finalArgs.input_filenames.includes(att.name)
                );
                
                if (attachmentsToLoad.length > 0) {
                    finalArgs.input_files = attachmentsToLoad.map((att: any) => ({
                        filename: att.name,
                        data: base64ToUint8Array(att.data)
                    }));
                }
            }
            delete finalArgs.input_filenames;
        }

        try {
            return await Promise.resolve(toolImplementation(finalArgs));
        } catch (err) {
            if (err instanceof ToolError) throw err;
    
            let errorMessage: string;
            if (err instanceof Error) {
                errorMessage = err.message;
            } else {
                try {
                    // Use JSON.stringify for better object representation
                    errorMessage = JSON.stringify(err);
                } catch {
                    // Fallback for circular references or other stringify errors
                    errorMessage = String(err);
                }
            }

            const originalError = err instanceof Error ? err : new Error(errorMessage);
            throw new ToolError(name, 'TOOL_EXECUTION_FAILED', errorMessage, originalError);
        }
    };
};