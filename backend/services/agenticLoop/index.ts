
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { parseApiError } from "../../utils/apiError.js";
import { ToolCallEvent } from "./types.js";
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
};

type RunAgenticLoopParams = {
    ai: GoogleGenAI;
    model: string;
    history: Content[];
    toolExecutor: (name: string, args: any) => Promise<string>;
    callbacks: Callbacks;
    settings: any;
    signal: AbortSignal;
};

// Define the graph state annotation
const AgentStateAnnotation = Annotation.Root({
    history: Annotation<Content[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    groundingMetadata: Annotation<any>({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),
});

// --- Helper Functions ---

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
        // Fallback if marker isn't perfectly formed, grab everything before next step or end
        const firstStepIndex = rawText.indexOf('[STEP]');
        if (firstStepIndex !== -1) {
            planText = rawText.substring(0, firstStepIndex);
        } else {
            planText = rawText;
        }
    }
    return planText.replace(/\[AGENT:.*?\]\s*/, '').replace(/\[USER_APPROVAL_REQUIRED\]/, '').trim();
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Main Loop Function ---

export const runAgenticLoop = async (params: RunAgenticLoopParams): Promise<void> => {
    const { ai, model, history, toolExecutor, callbacks, settings, signal } = params;
    
    console.log('[AGENT_LOOP] Initializing Agentic Loop'); // LOG

    // --- Node: Agent (Model Call) ---
    const agentNode = async (state: typeof AgentStateAnnotation.State) => {
        console.log('[AGENT_LOOP] Entering agentNode. History length:', state.history.length); // LOG
        if (signal.aborted) throw new Error("AbortError");

        let fullTextResponse = '';
        let hasSentPlan = false;
        let toolCalls: FunctionCall[] = [];
        let groundingMetadata: any = undefined;

        try {
            // Streaming call to Gemini
            console.log('[AGENT_LOOP] Invoking Gemini Stream...'); // LOG
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

                // Check for Plan Approval Interrupt
                const planMatch = fullTextResponse.includes('[USER_APPROVAL_REQUIRED]');
                if (planMatch && !hasSentPlan) {
                    console.log('[AGENT_LOOP] Plan approval required. Pausing...'); // LOG
                    hasSentPlan = true;
                    const planText = extractPlan(fullTextResponse);
                    
                    // Pause execution here waiting for frontend approval via the callback promise
                    const approval = await callbacks.onPlanReady(planText);

                    if (approval === false) {
                        console.log('[AGENT_LOOP] User denied execution.'); // LOG
                        throw new Error("AbortError"); // User denied execution
                    }
                    if (typeof approval === 'string') {
                        console.log('[AGENT_LOOP] User edited plan. Rewriting history.'); // LOG
                        // If user edited the plan, update the text stream essentially "rewriting" history
                        fullTextResponse = approval;
                        callbacks.onTextChunk(fullTextResponse);
                    }
                }
            }

            const response = await streamResult.response;
            toolCalls = response?.functionCalls || [];
            groundingMetadata = response?.candidates?.[0]?.groundingMetadata;

            console.log('[AGENT_LOOP] Agent generation complete. Tool calls:', toolCalls.length); // LOG

            // Construct the model's contribution to history
            const newContentParts: Part[] = [];
            if (fullTextResponse) {
                newContentParts.push({ text: fullTextResponse });
            }
            if (toolCalls.length > 0) {
                toolCalls.forEach(fc => newContentParts.push({ functionCall: fc }));
            }

            return {
                history: [{ role: 'model', parts: newContentParts }],
                groundingMetadata
            };

        } catch (error) {
            console.error('[AGENT_LOOP] Error in agentNode:', error); // LOG
            throw error;
        }
    };

    // --- Node: Tools (Execution) ---
    const toolsNode = async (state: typeof AgentStateAnnotation.State) => {
        console.log('[AGENT_LOOP] Entering toolsNode.'); // LOG
        if (signal.aborted) throw new Error("AbortError");

        const lastMessage = state.history[state.history.length - 1];
        // Extract function calls from the last message parts
        const toolCalls = lastMessage.parts?.filter(p => p.functionCall).map(p => p.functionCall!) || [];

        if (toolCalls.length === 0) {
            console.log('[AGENT_LOOP] No tool calls found in toolsNode.'); // LOG
            return {};
        }

        // Notify frontend of start
        const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({
            id: `${fc.name}-${generateId()}`,
            call: fc,
            startTime: Date.now()
        }));
        callbacks.onNewToolCalls(newToolCallEvents);

        console.log('[AGENT_LOOP] Executing tools:', toolCalls.map(tc => tc.name)); // LOG

        // Execute all tools in parallel
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
        
        console.log('[AGENT_LOOP] Tools executed. Returning results to graph.'); // LOG

        // Return tool outputs to history
        return {
            history: [{ role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr.functionResponse })) }]
        };
    };

    // --- Graph Definition ---

    const workflow = new StateGraph(AgentStateAnnotation)
        .addNode("agent", agentNode)
        .addNode("tools", toolsNode)
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
        console.log('[AGENT_LOOP] Starting Graph Invocation'); // LOG
        const finalState = await app.invoke({ history });

        // Extract final text for completion callback
        const lastMsg = finalState.history[finalState.history.length - 1];
        const finalText = lastMsg.parts?.find(p => p.text)?.text || "";

        if (!signal.aborted) {
            console.log('[AGENT_LOOP] Loop Completed Successfully.'); // LOG
            callbacks.onComplete(finalText, finalState.groundingMetadata);
        }

    } catch (error: any) {
        // Handle explicit aborts vs actual errors
        if (error.message === 'AbortError' || error.name === 'AbortError') {
            console.log('[AGENT_LOOP] Loop Cancelled.'); // LOG
            callbacks.onCancel();
        } else {
            console.error('[AGENT_LOOP] Loop Error:', error); // LOG
            callbacks.onError(parseApiError(error));
        }
    }
};
