/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FunctionCall, GenerateContentResponse } from '@google/genai';
import { initChat, parseApiError } from './gemini';
import { type ToolCallEvent, type MessageError, ToolError } from '../../types';

type Part = { text: string } | { inlineData: { mimeType: string; data: string; } } | { functionResponse: any };

type ChatHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

type ChatSettings = { 
    systemPrompt?: string; 
    temperature?: number; 
    maxOutputTokens?: number; 
};

type AgenticLoopCallbacks = {
    onTextChunk: (fullText: string) => void;
    onNewToolCalls: (toolCalls: FunctionCall[]) => Promise<ToolCallEvent[]>;
    onToolResult: (eventId: string, result: string) => void;
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
 */
export const runAgenticLoop = async ({
    model,
    history,
    toolExecutor,
    callbacks,
    settings,
    signal,
}: RunAgenticLoopParams): Promise<void> => {
    let keepProcessing = true;
    // Accumulates the full text of the model's response across multiple loop iterations.
    let fullModelResponseText = '';
    let hasError = false;

    // The history for initializing the chat should be all messages EXCEPT the last one.
    const historyForChat = history.slice(0, -1);
    const chat = initChat(model, historyForChat, settings);
    
    // The initial message payload is the last message in the history provided.
    const lastUserTurn = history[history.length - 1];
    let messagePayload: string | Part[] | { functionResponse: { name: string; response: { result: string; }; }; }[] = lastUserTurn.parts;
    
    do {
        if (signal.aborted) { break; }

        let stream: AsyncGenerator<GenerateContentResponse> | undefined;
        let apiError: unknown = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (signal.aborted) { break; }

            try {
                stream = await chat.sendMessageStream({ message: messagePayload });
                apiError = null;
                break;
            } catch (error) {
                // Ignore AbortError from user cancellation
                if ((error as Error).name === 'AbortError') {
                    apiError = error;
                    break;
                }
                console.error(`Agentic loop API call failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
                apiError = error;
                const structuredError = parseApiError(error);
                const isRetryable = structuredError.code === 'RATE_LIMIT_EXCEEDED' || structuredError.code === 'API_ERROR';

                if (isRetryable && attempt < MAX_RETRIES - 1) {
                    const delay = INITIAL_BACKOFF_MS * (2 ** attempt);
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    break;
                }
            }
        }
        
        if (signal.aborted) { break; }

        if (apiError || !stream) {
            if ((apiError as Error)?.name !== 'AbortError') {
                const finalError = apiError || new Error("Failed to get a response stream from the API.");
                const structuredError = parseApiError(finalError);
                callbacks.onError(structuredError);
            }
            keepProcessing = false;
            hasError = true;
        } else {
            try {
                const functionCallsToProcess: FunctionCall[] = [];
                let currentTurnText = '';
                let lastChunk: GenerateContentResponse | undefined;

                for await (const chunk of stream) {
                    if (signal.aborted) { break; }

                    lastChunk = chunk;
                    let chunkText = '';
                    const parts = chunk.candidates?.[0]?.content?.parts;
                    if (parts) {
                        for (const part of parts) {
                            if (part.text) {
                                chunkText += part.text;
                            }
                        }
                    }

                    if (chunkText) {
                        currentTurnText += chunkText;
                        fullModelResponseText += chunkText;
                        // Send the full, accumulated text on every chunk. This makes the loop the
                        // source of truth and prevents "vanishing text" bugs in the UI.
                        callbacks.onTextChunk(fullModelResponseText);
                    }
                    
                    if (chunk.functionCalls) {
                        functionCallsToProcess.push(...chunk.functionCalls);
                    }
                }
                
                if (signal.aborted) { break; }

                const finishReason = lastChunk?.candidates?.[0]?.finishReason;
                const shouldAutoContinue = finishReason === 'MAX_TOKENS';

                if (functionCallsToProcess.length > 0) {
                    const toolCallEvents = await callbacks.onNewToolCalls(functionCallsToProcess);
                    const functionResponses = await Promise.all(toolCallEvents.map(async (event) => {
                        if (signal.aborted) throw new Error('Aborted');
                        const { call } = event;
                        try {
                            const result = await toolExecutor(call.name, call.args);
                            callbacks.onToolResult(event.id, result);
                            return { functionResponse: { name: call.name, response: { result } } };
                        } catch (error) {
                            console.error(`Tool '${call.name}' execution failed, informing model:`, error);
                            let errorResult: string;
                            if (error instanceof ToolError) {
                                errorResult = `Tool execution failed. Code: ${error.code}. Reason: ${error.originalMessage}`;
                            } else if (error instanceof Error) {
                                errorResult = `An unknown error occurred during tool execution. Reason: ${error.message}`;
                            } else {
                                errorResult = 'An unknown error occurred during tool execution.';
                            }
                            
                            callbacks.onToolResult(event.id, errorResult);
                            
                            return { functionResponse: { name: call.name, response: { result: errorResult } } };
                        }
                    }));
                    
                    if (signal.aborted) { break; }

                    messagePayload = functionResponses;
                    keepProcessing = true;
                } else if (currentTurnText.trim().endsWith('[AUTO_CONTINUE]') || shouldAutoContinue) {
                    if (shouldAutoContinue && !currentTurnText.trim().endsWith('[AUTO_CONTINUE]')) {
                        const continueMarker = ' [AUTO_CONTINUE]';
                        fullModelResponseText += continueMarker;
                        callbacks.onTextChunk(fullModelResponseText);
                    }
                    messagePayload = "Continue";
                    keepProcessing = true;
                }
                else {
                    keepProcessing = false;
                }
            } catch (error) {
                 if (signal.aborted) { break; }
                 console.error("Agentic loop post-API call failed:", error);
                 // ToolErrors are now handled within the tool execution logic and sent back to the model.
                 // This catch block now primarily handles API stream errors or other unhandled exceptions.
                 const structuredError = parseApiError(error);
                 callbacks.onError(structuredError);
                 keepProcessing = false;
                 hasError = true;
            }
        }
    } while (keepProcessing && !signal.aborted);

    if (signal.aborted) {
        callbacks.onCancel();
        return;
    }

    if (!hasError) {
        const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
        callbacks.onComplete(finalCleanedText);
    }
};
