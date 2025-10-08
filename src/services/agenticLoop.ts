/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FunctionCall, GenerateContentResponse } from '@google/genai';
import { initChat, parseApiError } from './gemini';
import { type ToolCallEvent, type MessageError, ToolError } from '../types';

type Part = { text: string } | { inlineData: { mimeType: string; data: string; } } | { functionResponse: any };

type ChatHistory = {
    role: 'user' | 'model';
    parts: Part[];
}[];

type AgenticLoopCallbacks = {
    onTextChunk: (fullText: string) => void;
    onNewToolCalls: (toolCalls: FunctionCall[]) => Promise<ToolCallEvent[]>;
    onToolResult: (eventId: string, result: string) => void;
    onComplete: (finalText: string) => void;
    onError: (error: MessageError) => void;
};

type RunAgenticLoopParams = {
    model: string;
    history: ChatHistory;
    toolExecutor: (name: string, args: any) => Promise<string>;
    callbacks: AgenticLoopCallbacks;
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
}: RunAgenticLoopParams): Promise<void> => {
    let keepProcessing = true;
    // Accumulates the full text of the model's response across multiple loop iterations.
    let fullModelResponseText = '';

    // The history for initializing the chat should be all messages EXCEPT the last one.
    const historyForChat = history.slice(0, -1);
    const chat = initChat(model, historyForChat);
    
    // The initial message payload is the last message in the history provided.
    const lastUserTurn = history[history.length - 1];
    let messagePayload: string | Part[] | { functionResponse: { name: string; response: { result: string; }; }; }[] = lastUserTurn.parts;
    
    do {
        let stream: AsyncGenerator<GenerateContentResponse> | undefined;
        let apiError: unknown = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                stream = await chat.sendMessageStream({ message: messagePayload });
                apiError = null;
                break;
            } catch (error) {
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
        
        if (apiError || !stream) {
            const finalError = apiError || new Error("Failed to get a response stream from the API.");
            const structuredError = parseApiError(finalError);
            callbacks.onError(structuredError);
            keepProcessing = false;
        } else {
            try {
                const functionCallsToProcess: FunctionCall[] = [];
                let currentTurnText = '';
                let lastChunk: GenerateContentResponse | undefined;

                for await (const chunk of stream) {
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
                
                const finishReason = lastChunk?.candidates?.[0]?.finishReason;
                const shouldAutoContinue = finishReason === 'MAX_TOKENS';

                if (functionCallsToProcess.length > 0) {
                    const toolCallEvents = await callbacks.onNewToolCalls(functionCallsToProcess);
                    const functionResponses = await Promise.all(toolCallEvents.map(async (event) => {
                        const { call } = event;
                        const result = await toolExecutor(call.name, call.args);
                        callbacks.onToolResult(event.id, result);
                        return { functionResponse: { name: call.name, response: { result } } };
                    }));
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
                } else {
                    keepProcessing = false;
                }
            } catch (error) {
                 console.error("Agentic loop post-API call failed:", error);
                 let structuredError: MessageError;
 
                 if (error instanceof ToolError) {
                     structuredError = {
                         code: error.code,
                         message: `Error in '${error.toolName}' tool: ${error.originalMessage}`,
                         details: error.cause?.stack || error.stack,
                     };
                 } else {
                     structuredError = parseApiError(error);
                 }
                 callbacks.onError(structuredError);
                 keepProcessing = false;
            }
        }
    } while (keepProcessing);

    const finalCleanedText = fullModelResponseText.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    callbacks.onComplete(finalCleanedText);
};
