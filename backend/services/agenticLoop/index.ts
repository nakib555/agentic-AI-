/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { parseApiError } from "../../utils/apiError.js";
import { ToolCallEvent } from "../../types.js";
import { getText, generateContentStreamWithRetry } from "../../utils/geminiUtils.js";

// --- Types & Interfaces ---

type Callbacks = {
    onTextChunk: (text: string) => void;
    onNewToolCalls: (toolCallEvents: ToolCallEvent[]) => void;
    onToolResult: (id: string, result: string) => void;
    onPlanReady: (plan: string) => Promise<boolean | string>;
    onComplete: (finalText: string, groundingMetadata: any) => void;
    onCancel: () => void;
    onError: (error: any) => void;
    onFrontendToolRequest: (callId: string, name: string, args: any) => void;
};

type RunAgenticLoopParams = {
    ai: GoogleGenAI;
    model: string;
    history: Content[];
    toolExecutor: (name: string, args: any, id: string) => Promise<string>;
    callbacks: Callbacks;
    settings: any;
    signal: AbortSignal;
    threadId: string;
};

const extractPlan = (rawText: string): string => {
    const planMarker = '[STEP] Strategic Plan:';
    const planMarkerIndex = rawText.indexOf(planMarker);
    if (planMarkerIndex === -1) return rawText; 

    const planStart = rawText.substring(planMarkerIndex);
    return planStart.replace(/\[USER_APPROVAL_REQUIRED\][\s\S]*/, '').trim();
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Custom Agentic Loop Implementation ---

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { ai, model, history: initialHistory, toolExecutor, callbacks, settings, signal, threadId } = params;
    
    console.log(`[AGENT_LOOP] Starting Custom Orchestration for Thread ID: ${threadId}`);

    // Maintain local history state
    let history: Content[] = [...initialHistory];
    let turns = 0;
    const MAX_TURNS = 15; // Safety limit
    let finalAnswerAccumulator = "";
    let finalGroundingMetadata: any = undefined;

    try {
        while (turns < MAX_TURNS) {
            if (signal.aborted) throw new Error("AbortError");
            turns++;
            console.log(`[AGENT_LOOP] Turn ${turns}/${MAX_TURNS}`);

            let fullTextResponse = '';
            let toolCalls: FunctionCall[] = [];
            let groundingMetadata: any = undefined;
            let hasSentPlan = false;

            // 1. Generate Content (Streaming)
            console.log('[AGENT_LOOP] Invoking Gemini Stream...');
            const streamResult = await generateContentStreamWithRetry(ai, {
                model,
                contents: history,
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
                    finalAnswerAccumulator = fullTextResponse; // Track for final output
                    callbacks.onTextChunk(chunkText);
                }

                // Check for Plan Approval Pause
                const planMatch = fullTextResponse.includes('[USER_APPROVAL_REQUIRED]');
                if (planMatch && !hasSentPlan) {
                    console.log('[AGENT_LOOP] Plan approval required. Pausing for user input...');
                    hasSentPlan = true;
                    const planText = extractPlan(fullTextResponse);
                    
                    const approval = await callbacks.onPlanReady(planText);

                    if (approval === false) {
                        console.log('[AGENT_LOOP] User denied execution.');
                        throw new Error("AbortError");
                    }
                    if (typeof approval === 'string') {
                        console.log('[AGENT_LOOP] User edited plan. Injecting updated plan.');
                        const updateText = "\n\n[PLAN_APPROVED_BY_USER]";
                        fullTextResponse += updateText;
                        callbacks.onTextChunk(updateText); 
                    }
                }
            }

            const response = await streamResult.response;
            toolCalls = response?.functionCalls || [];
            groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata) finalGroundingMetadata = groundingMetadata;

            // 2. Add Model Response to History
            const newContentParts: Part[] = [];
            if (fullTextResponse) newContentParts.push({ text: fullTextResponse });
            if (toolCalls.length > 0) toolCalls.forEach(fc => newContentParts.push({ functionCall: fc }));
            
            history.push({ role: 'model', parts: newContentParts });

            // 3. Check for Termination (No tools, just text)
            if (toolCalls.length === 0) {
                console.log('[AGENT_LOOP] No tool calls detected. Ending loop.');
                break;
            }

            // 4. Execute Tools
            console.log(`[AGENT_LOOP] Executing ${toolCalls.length} tools...`);
            
            // Create UI Events
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({
                id: `${fc.name}-${generateId()}`,
                call: fc,
                startTime: Date.now()
            }));
            callbacks.onNewToolCalls(newToolCallEvents);

            // Execute in Parallel
            const toolPromises = toolCalls.map(async (call) => {
                if (signal.aborted) return null;
                const event = newToolCallEvents.find(e => e.call === call)!;
                
                try {
                    const result = await toolExecutor(call.name, call.args, event.id);
                    callbacks.onToolResult(event.id, result);
                    event.result = result;
                    event.endTime = Date.now();
                    
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
                    event.result = errorMessage;
                    event.endTime = Date.now();
                    
                    return {
                        functionResponse: {
                            name: call.name,
                            response: { error: errorMessage },
                        }
                    };
                }
            });

            const results = await Promise.all(toolPromises);
            const validToolResponses = results.filter(r => r !== null) as Part[];

            // 5. Add Tool Outputs to History
            history.push({ role: 'user', parts: validToolResponses });

            // If plan was just approved, inject the user confirmation message into history effectively
            if (hasSentPlan) {
                 // We already handled the pause, the next loop iteration continues naturally with tool results or new generation.
                 // We append a virtual steering message if no tools were called to force continuation,
                 // but since tools WERE called (logic above), the functionResponse is sufficient.
            }
        }

        if (!signal.aborted) {
            console.log('[AGENT_LOOP] Loop Completed Successfully.');
            callbacks.onComplete(finalAnswerAccumulator, finalGroundingMetadata);
        }

    } catch (error: any) {
        if (error.message === 'AbortError' || error.name === 'AbortError') {
            console.log('[AGENT_LOOP] Loop Cancelled.');
            callbacks.onCancel();
        } else {
            console.error('[AGENT_LOOP] Loop Error:', error);
            callbacks.onError(parseApiError(error));
        }
    }
};