
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { parseApiError } from "../../utils/apiError.js";
import { ToolCallEvent } from "./types.js";
import { getText, generateContentStreamWithRetry } from "../../utils/geminiUtils.js";

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

interface AgentState {
    history: Content[];
    groundingMetadata?: any;
}

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
    const generateId = () => Math.random().toString(36).substring(2, 9);

    // --- Node Definitions ---

    const callModel = async (state: AgentState): Promise<Partial<AgentState>> => {
        if (signal.aborted) throw new Error("AbortError");

        let fullTextResponse = '';
        let hasSentPlan = false;
        let toolCalls: FunctionCall[] = [];
        let groundingMetadata: any = undefined;

        try {
            const streamResult = await generateContentStreamWithRetry(ai, {
                model,
                contents: state.history,
                config: {
                    ...settings,
                    systemInstruction: settings.systemInstruction
                },
            });

            for await (const chunk of streamResult) {
                if (signal.aborted) throw new Error("AbortError");

                if (chunk.candidates && chunk.candidates[0].finishReason === FinishReason.SAFETY) {
                    throw new Error("Response was blocked due to safety policy.");
                }

                const chunkText = getText(chunk);
                if (chunkText) {
                    fullTextResponse += chunkText;
                    callbacks.onTextChunk(fullTextResponse);
                }

                // Handle Plan Approval Interruption
                const planMatch = fullTextResponse.includes('[USER_APPROVAL_REQUIRED]');
                if (planMatch && !hasSentPlan) {
                    hasSentPlan = true;
                    const planText = extractPlan(fullTextResponse);
                    const approval = await callbacks.onPlanReady(planText);

                    if (approval === false) {
                        throw new Error("AbortError"); // User denied
                    }
                    if (typeof approval === 'string') {
                        fullTextResponse = approval;
                        callbacks.onTextChunk(fullTextResponse);
                    }
                }
            }

            const response = await streamResult.response;
            toolCalls = response?.functionCalls || [];
            groundingMetadata = response?.candidates?.[0]?.groundingMetadata;

            const newContentParts: Part[] = [{ text: fullTextResponse }];
            if (toolCalls.length > 0) {
                toolCalls.forEach(fc => newContentParts.push({ functionCall: fc }));
            }

            return {
                history: [{ role: 'model', parts: newContentParts }],
                groundingMetadata
            };

        } catch (error) {
            throw error;
        }
    };

    const executeTools = async (state: AgentState): Promise<Partial<AgentState>> => {
        if (signal.aborted) throw new Error("AbortError");

        const lastMessage = state.history[state.history.length - 1];
        const toolCalls = lastMessage.parts?.filter(p => p.functionCall).map(p => p.functionCall!) || [];

        if (toolCalls.length === 0) return {};

        const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({
            id: `${fc.name}-${generateId()}`,
            call: fc,
            startTime: Date.now()
        }));
        callbacks.onNewToolCalls(newToolCallEvents);

        const toolResponses = await Promise.all(
            toolCalls.map(async (call: FunctionCall) => {
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

        return {
            history: [{ role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr.functionResponse })) }]
        };
    };

    // --- Graph Definition ---

    const workflow = new StateGraph<AgentState>({
        channels: {
            history: {
                reducer: (x: Content[], y: Content[]) => x.concat(y),
                default: () => [],
            },
            groundingMetadata: {
                reducer: (x, y) => y ?? x,
                default: () => undefined,
            }
        }
    })
    .addNode("agent", callModel)
    .addNode("tools", executeTools)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", (state) => {
        const lastMsg = state.history[state.history.length - 1];
        const hasToolCalls = lastMsg.parts?.some(p => p.functionCall);
        return hasToolCalls ? "tools" : END;
    })
    .addEdge("tools", "agent");

    const app = workflow.compile();

    // --- Execution ---

    try {
        const finalState = await app.invoke({ history: history as Content[] });
        
        // Check if we finished successfully and have a final text response
        const lastMsg = finalState.history[finalState.history.length - 1];
        const finalText = lastMsg.parts?.find(p => p.text)?.text || "";
        
        // If we ended naturally (not aborted/errored), notify completion
        if (!signal.aborted) {
            callbacks.onComplete(finalText, finalState.groundingMetadata);
        }

    } catch (error: any) {
        if (error.message === 'AbortError' || error.name === 'AbortError') {
            callbacks.onCancel();
        } else {
            callbacks.onError(parseApiError(error));
        }
    }
};
