
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { StateGraph, START, END, Annotation, MemorySaver } from "@langchain/langgraph";
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
    threadId: string;
};

// Define the graph state annotation with reducers
const AgentStateAnnotation = Annotation.Root({
    history: Annotation<Content[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    groundingMetadata: Annotation<any>({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),
    toolCalls: Annotation<FunctionCall[]>({
        reducer: (x, y) => y, // Replace
        default: () => [],
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
    const { ai, model, history, toolExecutor, callbacks, settings, signal, threadId } = params;
    
    console.log(`[AGENT_LOOP] Initializing LangGraph Workflow for Thread ID: ${threadId}`);

    // --- Node: Agent (Model Generation) ---
    const agentNode = async (state: typeof AgentStateAnnotation.State) => {
        console.log('[AGENT_LOOP] Entering agentNode. History length:', state.history.length);
        if (signal.aborted) throw new Error("AbortError");

        let fullTextResponse = '';
        let hasSentPlan = false;
        let toolCalls: FunctionCall[] = [];
        let groundingMetadata: any = undefined;

        try {
            console.log('[AGENT_LOOP] Invoking Gemini Stream...');
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

                const planMatch = fullTextResponse.includes('[USER_APPROVAL_REQUIRED]');
                if (planMatch && !hasSentPlan) {
                    console.log('[AGENT_LOOP] Plan approval required. Pausing for user input...');
                    hasSentPlan = true;
                    const planText = extractPlan(fullTextResponse);
                    
                    // Interrupt execution to wait for user approval
                    // Note: In this implementation, we await the promise directly to maintain the stream connection
                    const approval = await callbacks.onPlanReady(planText);

                    if (approval === false) {
                        console.log('[AGENT_LOOP] User denied execution.');
                        throw new Error("AbortError");
                    }
                    if (typeof approval === 'string') {
                        console.log('[AGENT_LOOP] User edited plan. Updating context.');
                        fullTextResponse = approval;
                        callbacks.onTextChunk(fullTextResponse);
                    }
                }
            }

            const response = await streamResult.response;
            toolCalls = response?.functionCalls || [];
            groundingMetadata = response?.candidates?.[0]?.groundingMetadata;

            console.log('[AGENT_LOOP] Agent generation complete. Tool calls:', toolCalls.length);

            const newContentParts: Part[] = [];
            if (fullTextResponse) {
                newContentParts.push({ text: fullTextResponse });
            }
            if (toolCalls.length > 0) {
                toolCalls.forEach(fc => newContentParts.push({ functionCall: fc }));
            }

            const historyUpdate: Content[] = [{ role: 'model', parts: newContentParts }];

            // If we just finished a plan approval sequence, inject a "Proceed" message to trigger the next turn
            if (hasSentPlan) {
                 historyUpdate.push({ 
                     role: 'user', 
                     parts: [{ text: "The plan is approved. Proceed with the execution." }] 
                 });
            }

            return {
                history: historyUpdate,
                groundingMetadata,
                toolCalls,
            };

        } catch (error) {
            console.error('[AGENT_LOOP] Error in agentNode:', error);
            throw error;
        }
    };

    // --- Node: Tools (Execution) ---
    const toolsNode = async (state: typeof AgentStateAnnotation.State) => {
        console.log('[AGENT_LOOP] Entering toolsNode.');
        if (signal.aborted) throw new Error("AbortError");

        const toolCalls = state.toolCalls;

        if (!toolCalls || toolCalls.length === 0) {
            return {};
        }

        const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({
            id: `${fc.name}-${generateId()}`,
            call: fc,
            startTime: Date.now()
        }));
        callbacks.onNewToolCalls(newToolCallEvents);

        console.log('[AGENT_LOOP] Executing tools:', toolCalls.map(tc => tc.name));

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
            history: [{ role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr.functionResponse })) }],
            toolCalls: [], // Clear tool calls after execution
        };
    };

    // --- Graph Definition ---

    // Initialize In-Memory Checkpointer for this session
    const checkpointer = new MemorySaver();

    const workflow = new StateGraph(AgentStateAnnotation)
        .addNode("agent", agentNode)
        .addNode("tools", toolsNode)
        .addEdge(START, "agent")
        .addConditionalEdges(
            "agent",
            (state) => {
                // If there are tool calls, go to tools
                if (state.toolCalls && state.toolCalls.length > 0) return "tools";
                
                // If the last message in history is a USER message (our injected "Proceed"),
                // loop back to agent to let it start executing the plan.
                const lastMsg = state.history[state.history.length - 1];
                if (lastMsg.role === 'user') {
                    return "agent";
                }
                
                return END;
            }
        )
        .addEdge("tools", "agent");

    const app = workflow.compile({ checkpointer });

    // --- Execution ---

    try {
        console.log('[AGENT_LOOP] Starting Graph Invocation');
        const finalState = await app.invoke(
            { history },
            { configurable: { thread_id: threadId } }
        );

        const lastMsg = finalState.history[finalState.history.length - 1];
        const finalText = lastMsg.parts?.find(p => p.text)?.text || "";

        if (!signal.aborted) {
            console.log('[AGENT_LOOP] Loop Completed Successfully.');
            callbacks.onComplete(finalText, finalState.groundingMetadata);
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
