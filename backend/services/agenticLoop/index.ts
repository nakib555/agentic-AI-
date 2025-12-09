
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, FunctionCall, FinishReason, Content } from "@google/genai";
import { StateGraph, START, END, Annotation, MemorySaver } from "@langchain/langgraph";
import { parseApiError } from "../../utils/apiError.js";
import { ToolCallEvent } from "../../types.js";
import { getText, generateContentStreamWithRetry } from "../../utils/geminiUtils.js";
import { parseAgenticWorkflow } from "../../utils/workflowParser.js";

// --- Types & Interfaces ---

type Callbacks = {
    onTextChunk: (text: string) => void;
    onNewToolCalls: (toolCallEvents: ToolCallEvent[]) => void;
    onToolResult: (id: string, result: string) => void;
    onPlanReady: (plan: string) => Promise<boolean | string>;
    onWorkflowUpdate: (workflow: any) => void; // New callback
    onComplete: (finalText: string, groundingMetadata: any) => void;
    onCancel: () => void;
    onError: (error: any) => void;
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
        reducer: (x, y) => y, // Replace current turn's calls
        default: () => [],
    }),
    latestAgentText: Annotation<string>({
        reducer: (x, y) => y || x,
        default: () => "",
    }),
    toolEvents: Annotation<ToolCallEvent[]>({ // Track all tool events for workflow parsing
        reducer: (x, y) => x.concat(y),
        default: () => [],
    })
});

const extractPlan = (rawText: string): string => {
    const planMarker = '[STEP] Strategic Plan:';
    const planMarkerIndex = rawText.indexOf(planMarker);
    if (planMarkerIndex === -1) return rawText; // Fallback

    // Heuristic: Plan is everything from the marker to the approval tag
    const planStart = rawText.substring(planMarkerIndex);
    return planStart.replace(/\[USER_APPROVAL_REQUIRED\][\s\S]*/, '').trim();
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
                    
                    // Live Workflow Update
                    const parsedWorkflow = parseAgenticWorkflow(fullTextResponse, state.toolEvents, false);
                    callbacks.onWorkflowUpdate(parsedWorkflow);
                }

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
                        // Replace the generated text with the user's edited plan to keep context consistent
                        fullTextResponse = approval + "\n\n[PLAN_APPROVED_BY_USER]"; 
                        callbacks.onTextChunk(fullTextResponse);
                    }
                }
            }

            const response = await streamResult.response;
            toolCalls = response?.functionCalls || [];
            groundingMetadata = response?.candidates?.[0]?.groundingMetadata;

            console.log(`[AGENT_LOOP] Agent generation complete. Generated ${toolCalls.length} tool calls.`);

            const newContentParts: Part[] = [];
            if (fullTextResponse) {
                newContentParts.push({ text: fullTextResponse });
            }
            if (toolCalls.length > 0) {
                toolCalls.forEach(fc => newContentParts.push({ functionCall: fc }));
            }

            const historyUpdate: Content[] = [{ role: 'model', parts: newContentParts }];

            // Inject a "System/User" prompt to nudge the model into the next step after plan approval
            if (hasSentPlan) {
                 historyUpdate.push({ 
                     role: 'user', 
                     parts: [{ text: "The plan is approved. Proceed immediately with the first step." }] 
                 });
            }

            // Final update for this turn
            const finalWorkflow = parseAgenticWorkflow(fullTextResponse, state.toolEvents, toolCalls.length === 0 && !hasSentPlan);
            callbacks.onWorkflowUpdate(finalWorkflow);

            return {
                history: historyUpdate,
                groundingMetadata,
                toolCalls,
                latestAgentText: fullTextResponse || state.latestAgentText
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

        // Create events for UI
        const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({
            id: `${fc.name}-${generateId()}`,
            call: fc,
            startTime: Date.now()
        }));
        
        callbacks.onNewToolCalls(newToolCallEvents);
        
        // Update local state with new events for parser
        const allToolEvents = [...state.toolEvents, ...newToolCallEvents];
        
        // Emit updated workflow immediately so UI shows "Active" tool
        const currentWorkflow = parseAgenticWorkflow(state.latestAgentText, allToolEvents, false);
        callbacks.onWorkflowUpdate(currentWorkflow);

        console.log('[AGENT_LOOP] Executing tools in parallel:', toolCalls.map(tc => tc.name));

        // Execute tools in parallel
        const toolResponses = await Promise.all(
            toolCalls.map(async (call: FunctionCall) => {
                const event = newToolCallEvents.find(e => e.call === call)!;
                try {
                    const result = await toolExecutor(call.name, call.args, event.id);
                    callbacks.onToolResult(event.id, result);
                    // Update event result for parser
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
            })
        );
        
        // Emit updated workflow after tools complete
        const updatedWorkflow = parseAgenticWorkflow(state.latestAgentText, allToolEvents, false);
        callbacks.onWorkflowUpdate(updatedWorkflow);
        
        return {
            history: [{ role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr.functionResponse })) }],
            toolCalls: [], // Clear tool calls so we don't loop back here immediately
            toolEvents: newToolCallEvents // Add to state accumulator
        };
    };

    // --- Graph Definition ---

    const checkpointer = new MemorySaver();

    const workflow = new StateGraph(AgentStateAnnotation)
        .addNode("agent", agentNode)
        .addNode("tools", toolsNode)
        .addEdge(START, "agent")
        .addConditionalEdges(
            "agent",
            (state) => {
                if (state.toolCalls && state.toolCalls.length > 0) {
                    return "tools";
                }
                // If we just injected the "Proceed" message (User role at end of history), loop back to agent
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
            { configurable: { thread_id: threadId } } as any
        );

        const finalText = finalState.latestAgentText;

        if (!signal.aborted) {
            console.log('[AGENT_LOOP] Loop Completed Successfully.');
            // Final parse with complete=true
            const finalWorkflow = parseAgenticWorkflow(finalText, finalState.toolEvents, true);
            callbacks.onWorkflowUpdate(finalWorkflow);
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