/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 3 of 4 from src/hooks/useChat.ts
// Contains the wrapper for executing tools.

import { toolImplementations } from '../../tools';
import { ToolError } from '../../types';
import { API_BASE_URL } from '../../utils/api';

const BACKEND_TOOLS = new Set([
    'generateImage',
    'analyzeMapVisually',
    'analyzeImageVisually',
    'duckduckgoSearch',
]);

const PISTON_LANGUAGES = new Set(['c', 'cpp', 'c++', 'csharp', 'c#', 'java', 'ruby', 'rb', 'go', 'rust', 'rs', 'php', 'swift']);

export const createToolExecutor = (imageModel: string, videoModel: string) => {
    return async (name: string, args: any): Promise<string> => {
        const lang = args.language?.toLowerCase();
        const isBackendTool = BACKEND_TOOLS.has(name) || (name === 'executeCode' && PISTON_LANGUAGES.has(lang));
        
        // --- Backend Tool Execution ---
        if (isBackendTool) {
            try {
                // Inject model selections for relevant tools before sending to backend
                let finalArgs = { ...args };
                if (name === 'generateImage') finalArgs.model = imageModel;
                if (name === 'generateVideo') finalArgs.model = videoModel;

                const response = await fetch(`${API_BASE_URL}/api/handler?task=tool_exec`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toolName: name, toolArgs: finalArgs }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: `Backend tool execution failed with status ${response.status}` } }));
                    const message = errorData.error?.message || 'Unknown backend error';
                    const code = errorData.error?.code || 'BACKEND_EXECUTION_FAILED';
                    const details = errorData.error?.details;
                    throw new ToolError(name, code, message, new Error(details));
                }
                const { result } = await response.json();
                return result;
            } catch (error) {
                if (error instanceof ToolError) throw error;
                const originalError = error instanceof Error ? error : new Error(String(error));
                throw new ToolError(name, 'BACKEND_FETCH_FAILED', originalError.message, originalError);
            }
        }

        // --- Frontend Tool Execution ---
        const toolImplementation = toolImplementations[name];
        if (!toolImplementation) {
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" not found.`);
        }
        
        // Inject model selections for relevant tools that have frontend wrappers
        let finalArgs = { ...args };
        if (name === 'generateVideo') finalArgs.model = videoModel;

        try {
            return await Promise.resolve(toolImplementation(finalArgs));
        } catch (err) {
            if (err instanceof ToolError) throw err;
            const originalError = err instanceof Error ? err : new Error(String(err));
            throw new ToolError(name, 'TOOL_EXECUTION_FAILED', originalError.message, originalError);
        }
    };
};