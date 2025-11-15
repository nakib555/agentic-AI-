/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseApiError } from '../../utils/apiError';
import { processStream } from './stream-processor';
import type { RunAgenticLoopParams, ToolCallEvent } from './types';
import { toolDeclarations } from '../../tools/declarations.js';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { ai, model, history, toolExecutor, callbacks, settings, signal } = params;
    console.log('[AGENTIC_LOOP] Starting runAgenticLoop.', { model, isAgentMode: settings.isAgentMode });
    
    let currentHistory = [...history];
    let fullModelResponseText = '';
    let hasCompleted = false;
    let planApproved = !settings.isAgentMode; // Auto-approve for non-agent mode

    const executeTurn = async () => {
        if (signal.aborted || hasCompleted) return;
        console.log('[AGENTIC_LOOP] Executing a new turn.');

        let stream;
        try {
            const config: any = {
                temperature: settings.temperature,
                systemInstruction: settings.systemInstruction,
                tools: settings.tools,
            };

            if (settings.maxOutputTokens && settings.maxOutputTokens > 0) {
                config.maxOutputTokens = settings.maxOutputTokens;
            }

            if (settings.thinkingBudget) {
                config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
            }

            const request: any = {
                model,
                contents: currentHistory,
                config,
            };
            
            console.log('[AGENTIC_LOOP] Calling Gemini API generateContentStream...');
            stream = await ai.models.generateContentStream(request);
        } catch (error) {
            console.error('[AGENTIC_LOOP] Gemini API call failed.', { error });
            if ((error as Error).name !== 'AbortError') callbacks.onError(parseApiError(error));
            hasCompleted = true;
            return;
        }

        console.log('[AGENTIC_LOOP] Processing Gemini stream...');
        const result = await processStream({ stream, signal, callbacks, fullModelResponseText, planApproved });
        console.log('[AGENTIC_LOOP] Stream processing result:', { status: result.status, nextAction: (result as any).nextAction });

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
                console.log('[AGENTIC_LOOP] Continuing with edited plan.');
                callbacks.onTextChunk(result.editedPlan);
                currentHistory.push({ role: 'model', parts: [{ text: result.editedPlan }] });
                currentHistory.push({ role: 'user', parts: [{ text: "The plan is approved. Proceed with execution." }] });
                nextActionPromise = executeTurn();
            } else if (result.nextAction === 'continue_with_tools') {
                console.log('[AGENTIC_LOOP] Continuing with tools.', { functionCalls: result.functionCalls });
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
                        console.log(`[AGENTIC_LOOP] Executing tool: ${event.call.name}`, { args: event.call.args });
                        const toolResult = await toolExecutor(event.call.name, event.call.args);
                        console.log(`[AGENTIC_LOOP] Tool '${event.call.name}' executed successfully.`);
                        callbacks.onToolResult(event.id, toolResult);
                        return { functionResponse: { name: event.call.name, response: { result: toolResult } } };
                    } catch (error: any) {
                        console.error(`[AGENTIC_LOOP] Tool '${event.call.name}' failed.`, { error });
                        const errorResult = `Tool execution failed. Reason: ${error.message}`;
                        callbacks.onToolResult(event.id, errorResult);
                        return { functionResponse: { name: event.call.name, response: { result: errorResult } } };
                    }
                }));

                if (signal.aborted) return;
                currentHistory.push({ role: 'user', parts: responseParts });
                nextActionPromise = executeTurn();
            } else if (result.nextAction === 'continue_generation') {
                console.log('[AGENTIC_LOOP] Continuing generation (AUTO_CONTINUE or MAX_TOKENS).');
                currentHistory.push({ role: 'model', parts: [{ text: result.currentTurnText }] });
                currentHistory.push({ role: 'user', parts: [{ text: "Continue" }] });
                nextActionPromise = executeTurn();
            }
            if (nextActionPromise) await nextActionPromise;

        } else { // 'complete'
            console.log('[AGENTIC_LOOP] Loop complete.');
            fullModelResponseText = result.fullText;
            const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
            callbacks.onComplete(finalCleanedText, result.groundingMetadata);
            hasCompleted = true;
        }
    };

    try {
        await executeTurn();
        if (signal.aborted && !hasCompleted) {
            console.log('[AGENTIC_LOOP] Loop aborted by signal.');
            callbacks.onCancel();
        }
    } catch (err) {
        if (!signal.aborted) {
            console.error('[AGENTIC_LOOP] Unhandled exception in agentic loop:', err);
            callbacks.onError(parseApiError(err));
        }
    }
};