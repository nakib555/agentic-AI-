/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed non-exported 'GenerateContentStreamResult' type and fixed stream handling logic.
import { GoogleGenAI, GenerateContentResponse, Part, FunctionCall, FinishReason } from "@google/genai";
import { parseApiError } from "../../utils/apiError.js";
import { ToolCallEvent } from "./types.js";
import { getText } from "../../utils/geminiUtils.js";

type Callbacks = {
    onTextChunk: (text: string) => void;
    onNewToolCalls: (toolCallEvents: ToolCallEvent[]) => void;
    onToolResult: (id: string, result: string) => void;
    onPlanReady: (plan: string) => Promise<boolean | string>;
    onComplete: (finalText: string, groundingMetadata: any) => void;
    onCancel: () => void;
    onError: (error: any) => void;
};

type RunAgenticLoopParams = {
    ai: GoogleGenAI;
    model: string;
    history: { role: 'user' | 'model', parts: Part[] }[];
    toolExecutor: (name: string, args: any) => Promise<string>;
    callbacks: Callbacks;
    settings: any;
    signal: AbortSignal;
};

const extractPlan = (rawText: string): string => {
    const planMarker = '[STEP] Strategic Plan:';
    const planMarkerIndex = rawText.indexOf(planMarker);
    let planText = '';

    if (planMarkerIndex !== -1) {
        const planContentStartIndex = planMarkerIndex + planMarker.length;
        const nextStepIndex = rawText.indexOf('[STEP]', planContentStartIndex);
        if (nextStepIndex !== -1) {
            planText = rawText.substring(planContentStartIndex, nextStepIndex);
        } else {
            planText = rawText.substring(planContentStartIndex);
        }
    } else {
        const firstStepIndex = rawText.indexOf('[STEP]');
        if (firstStepIndex !== -1) {
            planText = rawText.substring(0, firstStepIndex);
        } else {
            planText = rawText;
        }
    }
    return planText.replace(/\[AGENT:.*?\]\s*/, '').replace(/\[USER_APPROVAL_REQUIRED\]/, '').trim();
};

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { ai, model, history, toolExecutor, callbacks, settings, signal } = params;
    let currentHistory = [...history];
    
    const generateId = () => Math.random().toString(36).substring(2, 9);
    
    try {
        let safetyError = false;

        while (!signal.aborted && !safetyError) {
            let fullTextResponse = '';
            let hasSentPlan = false;

            const streamResult = await ai.models.generateContentStream({
                model,
                contents: currentHistory,
                config: {
                    ...settings,
                    systemInstruction: settings.systemInstruction
                },
            });

            for await (const chunk of streamResult.stream) {
                if (signal.aborted) {
                    const abortError = new Error("Request aborted by client");
                    abortError.name = 'AbortError';
                    throw abortError;
                }
                
                if (chunk.candidates && chunk.candidates[0].finishReason === FinishReason.SAFETY) {
                    callbacks.onError(parseApiError({ message: 'Response was blocked due to safety policy.' }));
                    safetyError = true;
                    break;
                }

                const chunkText = getText(chunk);
                if (chunkText) {
                    fullTextResponse += chunkText;
                    callbacks.onTextChunk(fullTextResponse);
                }
                
                const planMatch = fullTextResponse.includes('[USER_APPROVAL_REQUIRED]');
                if (planMatch && !hasSentPlan) {
                    hasSentPlan = true;
                    const planText = extractPlan(fullTextResponse);
                    const approval = await callbacks.onPlanReady(planText);
                    
                    if (approval === false) { // Denied
                        callbacks.onCancel();
                        return;
                    }
                    if (typeof approval === 'string') { // Approved with edits
                        fullTextResponse = approval;
                        callbacks.onTextChunk(fullTextResponse);
                    }
                }
            }

            if (safetyError) break;

            const response = await streamResult.response;
            const functionCalls = response.functionCalls || [];
            
            if (functionCalls.length > 0) {
                const newToolCallEvents: ToolCallEvent[] = functionCalls.map(fc => ({
                    id: `${fc.name}-${generateId()}`,
                    call: fc,
                    startTime: Date.now()
                }));
                callbacks.onNewToolCalls(newToolCallEvents);

                currentHistory.push({ role: 'model', parts: [{ text: fullTextResponse }, ...functionCalls.map(fc => ({ functionCall: fc }))] });

                const toolResponses = await Promise.all(
                    functionCalls.map(async (call: FunctionCall) => {
                        const event = newToolCallEvents.find(e => e.call === call)!;
                        try {
                            const result = await toolExecutor(call.name, call.args);
                            callbacks.onToolResult(event.id, result);
                            return {
                                functionResponse: {
                                    name: call.name,
                                    response: { result },
                                }
                            };
                        } catch (error) {
                            const parsedError = parseApiError(error);
                            const errorMessage = `Tool execution failed: ${parsedError.message}`;
                            callbacks.onToolResult(event.id, errorMessage);
                            return {
                                functionResponse: {
                                    name: call.name,
                                    response: { error: errorMessage },
                                }
                            };
                        }
                    })
                );

                currentHistory.push({ role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr.functionResponse })) });
                continue; 
            }
            
            callbacks.onComplete(fullTextResponse, response.candidates?.[0]?.groundingMetadata);
            break; 
        }
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            callbacks.onError(parseApiError(error));
        } else {
            callbacks.onCancel();
        }
    }
};
