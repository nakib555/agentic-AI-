/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FunctionCall, GenerateContentResponse } from '@google/genai';
import { initChat, parseApiError } from './gemini';
import { type ChatSession, type ToolCallEvent, type MessageError, ToolError } from '../types';

type AgenticLoopCallbacks = {
    onTextChunk: (chunk: string) => void;
    onNewToolCalls: (toolCalls: FunctionCall[]) => Promise<ToolCallEvent[]>;
    onToolResult: (eventId: string, result: string) => void;
    onComplete: () => void;
    onError: (error: MessageError) => void;
};

type RunAgenticLoopParams = {
    session: ChatSession;
    initialMessage: string;
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
    session,
    initialMessage,
    toolExecutor,
    callbacks,
}: RunAgenticLoopParams): Promise<void> => {
    // This flag controls the main processing loop.
    let keepProcessing = true;
    
    // The payload for the next API call. Starts with the user's message,
    // then can become tool results or a "Continue" prompt.
    let messagePayload: string | { functionResponse: { name: string; response: { result: string; }; }; }[] = initialMessage;
    
    // Prepare the history for the Gemini API.
    const historyForApi = session.messages
        // Filter out any messages marked as hidden (e.g., our "Continue" prompts).
        .filter(msg => !msg.isHidden)
        .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

    const chat = initChat(session.model, historyForApi);
    
    // This loop continues as long as the AI has more work to do in a single turn,
    // such as calling multiple tools or continuing a long response.
    do {
        let stream: AsyncGenerator<GenerateContentResponse> | undefined;
        let apiError: unknown = null;
        
        // --- Retry loop for the API call ---
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                stream = await chat.sendMessageStream({ message: messagePayload });
                apiError = null; // Clear previous attempt's error
                break; // Success, exit retry loop
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
                    break; // Max retries reached or non-retryable error, exit loop to handle the error
                }
            }
        }
        
        // --- After retry loop, check if API call ultimately failed ---
        if (apiError || !stream) {
            const finalError = apiError || new Error("Failed to get a response stream from the API.");
            const structuredError = parseApiError(finalError);
            callbacks.onError(structuredError);
            keepProcessing = false; // Stop the loop on definitive error
        } else {
            // --- API call succeeded, process the stream and tools ---
            try {
                const functionCallsToProcess: FunctionCall[] = [];
                // Reset the text for the current iteration of the loop.
                let fullTurnText = '';

                for await (const chunk of stream) {
                    // Manually concatenate text from all parts in the chunk.
                    // This is more robust than relying on the `.text` convenience getter, which can be
                    // unreliable when the stream contains mixed content (e.g., text and function calls),
                    // and was causing the "[AUTO_CONTINUE]" command to be missed.
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
                        fullTurnText += chunkText;
                        // Stream text chunks to the UI as they arrive.
                        callbacks.onTextChunk(chunkText);
                    }
                    
                    if (chunk.functionCalls) {
                        // Collect all tool calls from the stream.
                        functionCallsToProcess.push(...chunk.functionCalls);
                    }
                }
                
                // --- Decide the next action based on the AI's response ---
                if (functionCallsToProcess.length > 0) {
                    // The AI returned tool calls.
                    const toolCallEvents = await callbacks.onNewToolCalls(functionCallsToProcess);
                    const functionResponses = await Promise.all(toolCallEvents.map(async (event) => {
                        const { call } = event;
                        const result = await toolExecutor(call.name, call.args);
                        callbacks.onToolResult(event.id, result);

                        // Log the persisted state of long-running tasks after execution
                        if (call.name === 'longRunningTask') {
                            console.log(
                                'runAgenticLoop: Current state of long-running tasks from localStorage:', 
                                localStorage.getItem('taskStates')
                            );
                        }

                        return { functionResponse: { name: call.name, response: { result } } };
                    }));
                    // Set the tool results as the payload for the next loop iteration.
                    messagePayload = functionResponses;
                    keepProcessing = true; // Continue the loop to send results back to the AI.
                } else if (fullTurnText.trim().endsWith('[AUTO_CONTINUE]')) {
                    // The AI has more to say and sent the continuation signal.
                    // Set the payload for the next loop iteration to "Continue".
                    messagePayload = "Continue";
                    keepProcessing = true; // Continue the loop to get the next part.
                } else {
                    // The AI's response is complete (no tools, no continuation).
                    keepProcessing = false; // Exit the loop.
                }
            } catch (error) {
                 // This catch handles errors during post-API processing (e.g., ToolError)
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

    // The loop has finished, so the full turn is complete.
    callbacks.onComplete();
};