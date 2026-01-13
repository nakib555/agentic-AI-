/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { parseApiError } from "../../utils/apiError";
import { ToolCallEvent } from "../../types";
import { getText, generateContentStreamWithRetry } from "../../utils/geminiUtils";

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

    // Enforce a stricter system instruction for the loop if not already present
    // This helps the model stick to the [STEP] format expected by the frontend parser
    const agenticSystemSuffix = `
    
    IMPORTANT: You are in an automated execution loop.
    1. Always start your turn with a [STEP] block describing your current thought process or plan.
    2. If you need to use a tool, output the [STEP] block FIRST, then call the tool.
    3. If you are done, output [STEP] Final Answer: followed by the response.
    4. Do not ask the user for permission unless using the 'approveExecution' flow.
    `;

    const effectiveSystemInstruction = (settings.systemInstruction || '') + agenticSystemSuffix;

    try {
        while (turns < MAX_TURNS) {
            if (signal.aborted) throw new Error("AbortError");
            turns++;
            console.log(`[AGENT_LOOP] Turn ${turns}/${MAX_TURNS}`);

            let fullTextResponse = '';
            let toolCalls: FunctionCall[] = [];
            let groundingMetadata: any = undefined;

            // 1. Generate Content (Streaming)
            console.log('[AGENT_LOOP] Invoking Gemini Stream...');
            const streamResult = await generateContentStreamWithRetry(ai, {
                model,
                contents: history,
                config: {
                    ...settings,
                    systemInstruction: effectiveSystemInstruction
                },
            });

            for await (const chunk of streamResult) {
                if (signal.aborted) throw new Error("AbortError");

                // Check for safety blocking
                const candidate = chunk.candidates?.[0];
                if (candidate?.finishReason === FinishReason.SAFETY) {
                    throw new Error("Response was blocked due to safety policy.");
                }

                // Robust text extraction
                const chunkText = getText(chunk);
                if (chunkText) {
                    fullTextResponse += chunkText;
                    finalAnswerAccumulator = fullTextResponse; // Track for final output
                    callbacks.onTextChunk(chunkText);
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
            // If the model output a "Final Answer" marker, we should stop even if it hallucinated a tool call afterwards (rare but possible)
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
                    // Ensure call.name is a string (default to empty if undefined) to satisfy type requirements
                    const result = await toolExecutor(call.name || '', call.args, event.id);
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