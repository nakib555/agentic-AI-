/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, type FunctionCall, type GenerateContentResponse, type Part } from '@google/genai';
import { parseApiError } from './gemini';
import { type ToolCallEvent, type MessageError, ToolError } from '../../types';
import { systemInstruction } from '../prompts/system';
import { toolDeclarations } from '../tools';
import { getText } from '../utils/geminiUtils';
import { parseAgenticWorkflow, type ParsedWorkflow } from './workflowParser';


type ChatHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

type ChatSettings = { 
    systemPrompt?: string; 
    temperature?: number; 
    maxOutputTokens?: number;
    thinkingBudget?: number;
    memoryContent?: string;
};

type AgenticLoopCallbacks = {
    onTextChunk: (fullText: string) => void;
    onNewToolCalls: (toolCalls: FunctionCall[]) => Promise<ToolCallEvent[]>;
    onToolResult: (eventId: string, result: string) => void;
    onPlanReady: (plan: ParsedWorkflow) => Promise<boolean>;
    onComplete: (finalText: string) => void;
    onCancel: () => void;
    onError: (error: MessageError) => void;
};

type RunAgenticLoopParams = {
    model: string;
    history: ChatHistory;
    toolExecutor: (name: string, args: any) => Promise<string>;
    callbacks: AgenticLoopCallbacks;
    settings: ChatSettings;
    signal: AbortSignal;
};

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Orchestrates a multi-turn conversation with the AI model, handling text generation,
 * function calling, and continuous execution based on the AI's responses.
 * This version uses a recursive approach and the stateless `generateContentStream` API.
 */
export const runAgenticLoop = async ({
    model,
    history,
    toolExecutor,
    callbacks,
    settings,
    signal,
}: RunAgenticLoopParams): Promise<void> => {
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let currentHistory = [...history];
    let fullModelResponseText = '';
    let hasCompleted = false;
    let planApproved = false;

    const executeTurn = async () => {
        if (signal.aborted || hasCompleted) {
            return;
        }

        let stream: AsyncGenerator<GenerateContentResponse> | undefined;
        let apiError: unknown = null;
        
        // Build config for this turn
        let finalSystemInstruction = systemInstruction;
        if (settings?.memoryContent) {
            const memoryPreamble = `
// SECTION 0: CONVERSATION MEMORY
// Here is a summary of key information from past conversations with this user. Use this to personalize your responses and maintain continuity.
${settings.memoryContent}
`;
            finalSystemInstruction = `${memoryPreamble}\n${systemInstruction}`;
        }

        const config: any = {
            systemInstruction: settings?.systemPrompt
                ? `${settings.systemPrompt}\n\n${finalSystemInstruction}`
                : finalSystemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }],
        };
        
        if (settings?.temperature !== undefined) config.temperature = settings.temperature;
        if (settings?.thinkingBudget) {
            config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
        } else if (settings?.maxOutputTokens && settings.maxOutputTokens > 0) {
            config.maxOutputTokens = settings.maxOutputTokens;
        }

        // --- 1. API Call with Retry Logic ---
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (signal.aborted) return;
            try {
                stream = await ai.models.generateContentStream({
                    model: model,
                    contents: currentHistory,
                    config: config
                });
                apiError = null;
                break;
            } catch (error) {
                if ((error as Error).name === 'AbortError') { apiError = error; break; }
                console.error(`Agentic loop API call failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
                apiError = error;
                const structuredError = parseApiError(error);
                const isRetryable = structuredError.code === 'RATE_LIMIT_EXCEEDED' || structuredError.code === 'API_ERROR';
                if (isRetryable && attempt < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, INITIAL_BACKOFF_MS * (2 ** attempt)));
                } else {
                    break;
                }
            }
        }

        if (signal.aborted) return;

        if (apiError || !stream) {
            if ((apiError as Error)?.name !== 'AbortError') {
                const finalError = apiError || new Error("Failed to get a response stream from the API.");
                callbacks.onError(parseApiError(finalError));
            }
            hasCompleted = true;
            return;
        }

        // --- 2. Process Stream for Text and Tool Calls ---
        try {
            const functionCallsToProcess: FunctionCall[] = [];
            let currentTurnText = '';
            let lastChunk: GenerateContentResponse | undefined;
            const modelTurnParts: Part[] = [];

            for await (const chunk of stream) {
                if (signal.aborted) return;
                lastChunk = chunk;
                
                const chunkText = getText(chunk);

                if (chunkText) {
                    currentTurnText += chunkText;
                    fullModelResponseText += chunkText;
                    callbacks.onTextChunk(fullModelResponseText);

                    // --- Interactive Planning Check ---
                    if (!planApproved && currentTurnText.includes('[STEP] Handoff: Planner -> Executor')) {
                        const plan = parseAgenticWorkflow(currentTurnText, [], false);
                        const userApproved = await callbacks.onPlanReady(plan);
                        if (userApproved) {
                            planApproved = true;
                        } else {
                            // User denied the plan, so we abort.
                            callbacks.onError({
                                code: 'USER_DENIED_EXECUTION',
                                message: 'Execution was cancelled by the user.',
                                details: 'User did not approve the generated plan.',
                            });
                            hasCompleted = true;
                            return; // Exit the loop
                        }
                    }
                }
                
                if (chunk.functionCalls) {
                    functionCallsToProcess.push(...chunk.functionCalls);
                }
            }
            
            if (signal.aborted) return;

            // --- 3. Decide Next Action: Recurse with Tool Results or Complete ---
            const finishReason = lastChunk?.candidates?.[0]?.finishReason;
            const shouldAutoContinue = finishReason === 'MAX_TOKENS';

            if (currentTurnText) {
                modelTurnParts.push({ text: currentTurnText });
            }

            if (functionCallsToProcess.length > 0) {
                functionCallsToProcess.forEach(fc => modelTurnParts.push({ functionCall: fc }));
                currentHistory.push({ role: 'model', parts: modelTurnParts });
                
                const toolCallEvents = await callbacks.onNewToolCalls(functionCallsToProcess);
                
                const functionResponseParts: Part[] = [];
                const visualParts: Part[] = [];

                await Promise.all(toolCallEvents.map(async (event) => {
                    if (signal.aborted) throw new Error('Aborted');
                    const { call } = event;
                    try {
                        const result = await toolExecutor(call.name, call.args);
                        callbacks.onToolResult(event.id, result);

                        // SPECIAL HANDLING: If the tool is the screenshot tool, its result is a base64 image
                        // that needs to be treated as a visual input part, not a standard functionResponse.
                        if (call.name === 'captureCodeOutputScreenshot') {
                            visualParts.push({
                                inlineData: { mimeType: 'image/png', data: result }
                            });
                            // Also add a text part to confirm to the model that the action was successful.
                            functionResponseParts.push({
                                functionResponse: { name: call.name, response: { result: "Screenshot captured successfully and is now visible." } }
                            });
                        } else {
                            functionResponseParts.push({
                                functionResponse: { name: call.name, response: { result } }
                            });
                        }

                    } catch (error) {
                        const errorResult = error instanceof ToolError
                            ? `Tool execution failed. Code: ${error.code}. Reason: ${error.originalMessage}`
                            : `An unknown error occurred. Reason: ${error instanceof Error ? error.message : String(error)}`;
                        callbacks.onToolResult(event.id, errorResult);
                        functionResponseParts.push({
                            functionResponse: { name: call.name, response: { result: errorResult } }
                        });
                    }
                }));
                
                if (signal.aborted) return;

                // Add all tool results (both standard and visual) to the history for the next turn.
                currentHistory.push({ role: 'user', parts: [...functionResponseParts, ...visualParts] });
                await executeTurn(); // Recursive call

            } else if (currentTurnText.trim().endsWith('[AUTO_CONTINUE]') || shouldAutoContinue) {
                 if (shouldAutoContinue && !currentTurnText.trim().endsWith('[AUTO_CONTINUE]')) {
                    const continueMarker = ' [AUTO_CONTINUE]';
                    fullModelResponseText += continueMarker;
                    callbacks.onTextChunk(fullModelResponseText);
                    currentTurnText += continueMarker;
                 }
                 currentHistory.push({ role: 'model', parts: [{ text: currentTurnText }] });
                 currentHistory.push({ role: 'user', parts: [{ text: "Continue" }] });
                 await executeTurn(); // Recursive call to continue generation
            } else {
                const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
                callbacks.onComplete(finalCleanedText);
                hasCompleted = true;
            }
        } catch (error) {
            if (signal.aborted) return;
            console.error("Agentic loop stream processing failed:", error);
            callbacks.onError(parseApiError(error));
            hasCompleted = true;
        }
    };

    // --- Start the recursive execution ---
    await executeTurn();

    if (signal.aborted) {
        if (!hasCompleted) {
            callbacks.onCancel();
        }
    }
};
