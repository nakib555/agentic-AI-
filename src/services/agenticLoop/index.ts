/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 1 of 2 from src/services/agenticLoop.ts
// Main orchestrator for the agentic loop.

import { parseApiError } from '../gemini/index';
import { processStream } from './stream-processor';
import type { RunAgenticLoopParams } from './types';
import { ToolError } from '../../types';
import { API_BASE_URL } from '../../utils/api';

async function* ndJsonStreamGenerator(readableStream: ReadableStream<Uint8Array>): AsyncGenerator<any> {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            if (buffer.trim()) {
                try {
                    yield JSON.parse(buffer);
                } catch (e) {
                    console.error("Failed to parse final JSON chunk:", buffer, e);
                }
            }
            break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line
        for (const line of lines) {
            if (line.trim()) {
                try {
                    yield JSON.parse(line);
                } catch(e) {
                    console.error("Failed to parse JSON chunk:", line, e);
                }
            }
        }
    }
}

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { model, history, toolExecutor, callbacks, settings, signal } = params;
    let currentHistory = [...history];
    let fullModelResponseText = '';
    let hasCompleted = false;
    let planApproved = false;

    const executeTurn = async () => {
        if (signal.aborted || hasCompleted) return;

        let stream: AsyncGenerator<any> | undefined;
        let apiError: unknown = null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/handler?task=chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    history: currentHistory,
                    settings,
                }),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorJson = {};
                try {
                    errorJson = JSON.parse(errorText);
                } catch(e) {
                    // ignore if not json
                }
                 if (errorJson && (errorJson as any).error) {
                    throw (errorJson as any).error;
                 }
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            if (!response.body) {
                throw new Error('Response body is null.');
            }

            stream = ndJsonStreamGenerator(response.body);

        } catch (error) {
            if ((error as Error).name === 'AbortError') { apiError = error; }
            else { apiError = error; }
        }

        if (signal.aborted) return;
        if (apiError || !stream) {
            if ((apiError as Error)?.name !== 'AbortError') callbacks.onError(parseApiError(apiError || "Failed to get stream."));
            hasCompleted = true;
            return;
        }

        const result = await processStream({ stream, signal, callbacks, fullModelResponseText, planApproved });

        if (result.status === 'error') {
            if (!signal.aborted) callbacks.onError(result.error);
            hasCompleted = true;
        } else if (result.status === 'aborted') {
            hasCompleted = true; // onCancel will be handled by the final check
        } else if (result.status === 'running') {
            if (result.nextAction === 'continue_with_edited_plan') {
                fullModelResponseText = result.editedPlan; // Update the full text to reflect the user's edits.
                planApproved = true; // Mark plan as approved for subsequent turns.
                callbacks.onTextChunk(fullModelResponseText); // Update the UI immediately with the new plan.
    
                // "Replace" the model's original plan with the user's edited version in the history.
                currentHistory.push({ role: 'model', parts: [{ text: result.editedPlan }] });
                
                // Add a simple user prompt to tell the model to start executing the plan it just "provided".
                currentHistory.push({ role: 'user', parts: [{ text: "The plan is approved. Proceed with execution." }] });
                
                await executeTurn();
            } else {
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
                                    // Use JSON.stringify for better object representation
                                    errorMessage = JSON.stringify(error, null, 2);
                                } catch {
                                    // Fallback for circular references or other stringify errors
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
            }
        } else { // 'complete'
            fullModelResponseText = result.fullText;
            const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
            callbacks.onComplete(finalCleanedText, result.groundingMetadata);
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
            console.error('Unhandled exception in agentic loop:', err instanceof Error ? err : JSON.stringify(err));
            callbacks.onError(parseApiError(err));
        }
        hasCompleted = true; // Ensure onCancel isn't called after an error
    }
};