
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { fetchFromApi } from '../../utils/api';
import { parseApiError } from '../../services/gemini/index';
import { toolImplementations as frontendToolImplementations } from '../../tools';

export const useToolHandler = () => {
    // Helper to send tool response with robust retry logic
    const sendToolResponse = useCallback(async (callId: string, payload: any) => {
        let attempts = 0;
        const maxAttempts = 4;
        const baseDelay = 1000;

        while (attempts < maxAttempts) {
            try {
                const response = await fetchFromApi('/api/handler?task=tool_response', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId, ...payload }),
                });

                if (response.ok) return;

                if (response.status === 404) {
                    console.warn(`[FRONTEND] Backend session lost (404) for tool response ${callId}. Stopping retries.`);
                    return;
                }
                
                throw new Error(`Backend returned status ${response.status}`);
            } catch (e) {
                const err = e as Error;
                if (err.message === 'Version mismatch') throw err;

                attempts++;
                console.warn(`[FRONTEND] Tool response fetch failed (Attempt ${attempts}/${maxAttempts}): ${err.message}`);
                
                if (attempts >= maxAttempts) {
                    console.error(`[FRONTEND] Giving up on sending tool response for ${callId} after ${maxAttempts} attempts.`);
                    return;
                }
                
                const delay = baseDelay * Math.pow(2, attempts - 1) + (Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, []);

    const handleFrontendToolExecution = useCallback(async (callId: string, toolName: string, toolArgs: any) => {
        console.log(`[FRONTEND] Received request to execute tool: ${toolName}`, { callId, toolArgs });
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
            console.log(`[FRONTEND] Tool '${toolName}' executed successfully. Sending result to backend.`, { callId });
            
            await sendToolResponse(callId, { result });

        } catch (error) {
            if ((error as Error).message === 'Version mismatch') return;

            const parsedError = parseApiError(error);
            console.error(`[FRONTEND] Tool '${toolName}' execution failed. Sending error to backend.`, { callId, error: parsedError });
            
            await sendToolResponse(callId, { error: parsedError.message });
        }
    }, [sendToolResponse]);

    return { handleFrontendToolExecution, sendToolResponse };
};
