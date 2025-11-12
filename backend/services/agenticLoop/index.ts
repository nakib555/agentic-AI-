/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseApiError } from '../../utils/apiError';
import { processStream } from './stream-processor';
import type { RunAgenticLoopParams, ToolCallEvent } from './types';
import { toolDeclarations } from '../../tools/declarations';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { ai, model, history, toolExecutor, callbacks, settings, signal } = params;
    
    let currentHistory = [...history];
    let fullModelResponseText = '';
    let hasCompleted = false;
    let planApproved = !settings.isAgentMode; // Auto-approve for non-agent mode

    const executeTurn = async () => {
        if (signal.aborted || hasCompleted) return;

        let stream;
        try {
            const config: any = {
                systemInstruction: settings.systemInstruction,
                tools: settings.isAgentMode ? [{ functionDeclarations: toolDeclarations }] : settings.tools,
                temperature: settings.temperature,
            };
            // Only set maxOutputTokens if it's a positive number
            if (settings.maxOutputTokens && settings.maxOutputTokens > 0) {
                config.maxOutputTokens = settings.maxOutputTokens;
            }
            if (settings.thinkingBudget) {
                config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
            }
            
            stream = await ai.models.generateContentStream({
                model,
                contents: currentHistory,
                config,
            });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') callbacks.onError(parseApiError(error));
            hasCompleted = true;
            return;
        }

        const result = await processStream({ stream, signal, callbacks, fullModelResponseText, planApproved });

        if (result.status === 'error') {
            if (!signal.aborted) callbacks.onError(result.error);
            hasCompleted = true;
        } else if (result.status === 'aborted') {
            hasCompleted = true;
        } else if (result.status === 'running') {
            fullModelResponseText = result.fullText;
            planApproved = result.planApproved;
            
            let nextActionPromise: Promise<any> | null = null;
            
            if (result.nextAction === 'continue_with_edited_plan') {
                callbacks.onTextChunk(result.editedPlan);
                currentHistory.push({ role: 'model', parts: [{ text: result.editedPlan }] });
                currentHistory.push({ role: 'user', parts: [{ text: "The plan is approved. Proceed with execution." }] });
                nextActionPromise = executeTurn();
            } else if (result.nextAction === 'continue_with_tools') {
                currentHistory.push({ role: 'model', parts: result.modelTurnParts });
                
                // Create events with unique IDs from the raw function calls
                const toolCallEvents: ToolCallEvent[] = result.functionCalls.map(fc => ({
                    id: `${fc.name}-${generateId()}`,
                    call: fc
                }));

                // Notify the UI about the new tool calls, now with IDs
                callbacks.onNewToolCalls(toolCallEvents);

                const responseParts = await Promise.all(toolCallEvents.map(async (event) => {
                    if (signal.aborted) throw new Error('Aborted');
                    try {
                        const toolResult = await toolExecutor(event.call.name, event.call.args);
                        callbacks.onToolResult(event.id, toolResult);
                        return { functionResponse: { name: event.call.name, response: { result: toolResult } } };
                    } catch (error: any) {
                        const errorResult = `Tool execution failed. Reason: ${error.message}`;
                        callbacks.onToolResult(event.id, errorResult);
                        return { functionResponse: { name: event.call.name, response: { result: errorResult } } };
                    }
                }));

                if (signal.aborted) return;
                currentHistory.push({ role: 'user', parts: responseParts });
                nextActionPromise = executeTurn();
            } else if (result.nextAction === 'continue_generation') {
                currentHistory.push({ role: 'model', parts: [{ text: result.currentTurnText }] });
                currentHistory.push({ role: 'user', parts: [{ text: "Continue" }] });
                nextActionPromise = executeTurn();
            }
            if (nextActionPromise) await nextActionPromise;

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
            console.error('Unhandled exception in agentic loop:', err);
            callbacks.onError(parseApiError(err));
        }
    }
};