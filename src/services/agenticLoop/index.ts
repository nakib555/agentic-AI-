/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 1 of 2 from src/services/agenticLoop.ts
// Main orchestrator for the agentic loop.

import { GoogleGenAI } from '@google/genai';
import { parseApiError } from '../gemini/index';
import { systemInstruction } from '../../prompts/system';
import { toolDeclarations } from '../../tools';
import { processStream } from './stream-processor';
import type { RunAgenticLoopParams } from './types';
import { ToolError } from '../../types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { model, history, toolExecutor, callbacks, settings, signal } = params;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let currentHistory = [...history];
    let fullModelResponseText = '';
    let hasCompleted = false;
    let planApproved = false;

    const executeTurn = async () => {
        if (signal.aborted || hasCompleted) return;

        let finalSystemInstruction = systemInstruction;
        if (settings?.memoryContent) {
            finalSystemInstruction = `// SECTION 0: CONVERSATION MEMORY\n// Here is a summary of key information from past conversations.\n${settings.memoryContent}\n\n${systemInstruction}`;
        }
        const config: any = {
            systemInstruction: settings?.systemPrompt ? `${settings.systemPrompt}\n\n${finalSystemInstruction}` : finalSystemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }],
        };
        if (settings?.temperature !== undefined) config.temperature = settings.temperature;
        if (settings?.thinkingBudget) config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
        else if (settings?.maxOutputTokens && settings.maxOutputTokens > 0) config.maxOutputTokens = settings.maxOutputTokens;

        let stream: AsyncGenerator<any> | undefined;
        let apiError: unknown = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (signal.aborted) return;
            try {
                stream = await ai.models.generateContentStream({ model, contents: currentHistory, config });
                apiError = null;
                break;
            } catch (error) {
                if ((error as Error).name === 'AbortError') { apiError = error; break; }
                apiError = error;
                const structuredError = parseApiError(error);
                const isRetryable = structuredError.code === 'RATE_LIMIT_EXCEEDED' || structuredError.code === 'API_ERROR';
                if (isRetryable && attempt < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, INITIAL_BACKOFF_MS * (2 ** attempt)));
                } else break;
            }
        }

        if (signal.aborted) return;
        if (apiError || !stream) {
            if ((apiError as Error)?.name !== 'AbortError') callbacks.onError(parseApiError(apiError || "Failed to get stream."));
            hasCompleted = true;
            return;
        }

        const result = await processStream({ stream, signal, callbacks, fullModelResponseText, planApproved });

        // FIX: Use a type-safe if/else if chain to correctly discriminate the result union type.
        if (result.status === 'error') {
            if (!signal.aborted) callbacks.onError(result.error);
            hasCompleted = true;
        } else if (result.status === 'aborted') {
            hasCompleted = true; // onCancel will be handled by the final check
        } else if (result.status === 'running') {
            fullModelResponseText = result.fullText;
            planApproved = result.planApproved;

            if (result.nextAction === 'continue_with_tools') {
                currentHistory.push({ role: 'model', parts: result.modelTurnParts });
                const toolEvents = await callbacks.onNewToolCalls(result.functionCalls);
                
                const responseParts = await Promise.all(toolEvents.map(async (event) => {
                    if (signal.aborted) throw new Error('Aborted');
                    try {
                        const toolResult = await toolExecutor(event.call.name, event.call.args);
                        callbacks.onToolResult(event.id, toolResult);
                        if (event.call.name === 'captureCodeOutputScreenshot') {
                            return [
                                { inlineData: { mimeType: 'image/png', data: toolResult } },
                                { functionResponse: { name: event.call.name, response: { result: "Screenshot captured." } } }
                            ];
                        }
                        return [{ functionResponse: { name: event.call.name, response: { result: toolResult } } }];
                    } catch (error: any) {
                        let errorMessage: string;
                        // This provides more robust error message extraction.
                        if (error instanceof ToolError) {
                            errorMessage = error.originalMessage;
                        } else if (error instanceof Error) {
                            errorMessage = error.message;
                        } else {
                            try {
                                errorMessage = JSON.stringify(error, null, 2);
                            } catch {
                                errorMessage = String(error);
                            }
                        }
            
                        const errorResult = `Tool execution failed. Reason: ${errorMessage}`;
                        callbacks.onToolResult(event.id, errorResult);
                        return [{ functionResponse: { name: event.call.name, response: { result: errorResult } } }];
                    }
                }));

                if (signal.aborted) return;
                currentHistory.push({ role: 'user', parts: responseParts.flat() });
                await executeTurn();
            } else if (result.nextAction === 'continue_generation') {
                currentHistory.push({ role: 'model', parts: [{ text: result.currentTurnText }] });
                currentHistory.push({ role: 'user', parts: [{ text: "Continue" }] });
                await executeTurn();
            }
        } else { // 'complete'
            fullModelResponseText = result.fullText;
            const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
            callbacks.onComplete(finalCleanedText);
            hasCompleted = true;
        }
    };

    try {
        await executeTurn();
        if (signal.aborted && !hasCompleted) {
            callbacks.onCancel();
        }
    } catch (err) {
        if (!signal.aborted) {
            // This is a safety net for any unhandled exceptions from the loop.
            console.error('Unhandled exception in agentic loop:', err);
            callbacks.onError(parseApiError(err));
        }
        hasCompleted = true; // Ensure onCancel isn't called after an error
    }
};