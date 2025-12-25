
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from "openai";
import { GenerateContentResponse, Part, FunctionCall } from "@google/genai";
import { ToolError } from "./apiError.js";

// Initialize OpenAI client dynamically to support changing keys
const getOpenRouterClient = (apiKey: string) => {
    return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://agentic-ai-chat.render.com", // Site URL
            "X-Title": "Agentic AI Chat", // App Name
        }
    });
};

/**
 * Transforms internal History format (Gemini Content[]) to OpenAI Message format.
 */
const toOpenAIMessages = (history: any[], systemInstruction?: string) => {
    const messages: any[] = [];

    if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
    }

    history.forEach((item) => {
        const role = item.role === 'model' ? 'assistant' : 'user';
        let content = "";
        let toolCalls: any[] = [];
        let toolResponse: any = null;

        if (item.parts) {
            item.parts.forEach((part: any) => {
                if (part.text) content += part.text;
                
                // Handle Function Calls (Model -> User)
                if (part.functionCall) {
                    toolCalls.push({
                        id: `call_${Math.random().toString(36).substr(2, 9)}`, // Fake ID as Gemini history doesn't store original call IDs easily
                        type: 'function',
                        function: {
                            name: part.functionCall.name,
                            arguments: JSON.stringify(part.functionCall.args)
                        }
                    });
                }

                // Handle Function Responses (User -> Model)
                if (part.functionResponse) {
                    // OpenAI expects tool responses to be separate messages linked by ID.
                    // This is tricky with the unified Gemini history format.
                    // Simplified: We treat tool responses as user text for now in this adapter 
                    // unless we rebuild the full tool chain ID map.
                    // For robust agentic loops, the agent puts the tool output in the next user message anyway.
                    content += `\n[Tool ${part.functionResponse.name} Output]: ${JSON.stringify(part.functionResponse.response)}`;
                }
            });
        }

        const msg: any = { role };
        if (content) msg.content = content;
        if (toolCalls.length > 0) msg.tool_calls = toolCalls;
        
        messages.push(msg);
    });

    return messages;
};

/**
 * Transforms Gemini Tools to OpenAI Tools format.
 */
const toOpenAITools = (geminiTools: any[]) => {
    if (!geminiTools || geminiTools.length === 0) return undefined;
    
    // Flatten tool declarations
    const tools: any[] = [];
    geminiTools.forEach(toolBlock => {
        if (toolBlock.functionDeclarations) {
            toolBlock.functionDeclarations.forEach((fd: any) => {
                tools.push({
                    type: "function",
                    function: {
                        name: fd.name,
                        description: fd.description,
                        parameters: fd.parameters // Schema is largely compatible
                    }
                });
            });
        }
    });
    return tools.length > 0 ? tools : undefined;
};

/**
 * Adapter that streams OpenRouter (OpenAI) responses but yields 
 * chunks in a shape compatible with Gemini's `GenerateContentResponse`.
 */
export async function* generateContentStreamOpenRouter(
    apiKey: string,
    model: string,
    contents: any[],
    config: any
): AsyncGenerator<GenerateContentResponse> {
    const openai = getOpenRouterClient(apiKey);
    const messages = toOpenAIMessages(contents, config.systemInstruction);
    const tools = toOpenAITools(config.tools);

    try {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: messages,
            tools: tools,
            temperature: config.temperature,
            max_tokens: config.maxOutputTokens,
            stream: true,
        });

        // Buffers for accumulating tool calls which are streamed in chunks by OpenAI
        let currentToolCalls: { [index: number]: { name: string, args: string, id: string } } = {};

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            
            // 1. Handle Text Content
            if (delta?.content) {
                yield {
                    candidates: [{
                        content: {
                            parts: [{ text: delta.content }],
                            role: 'model'
                        }
                    }]
                } as GenerateContentResponse;
            }

            // 2. Handle Tool Calls (Accumulation)
            if (delta?.tool_calls) {
                delta.tool_calls.forEach((tc) => {
                    const idx = tc.index;
                    if (!currentToolCalls[idx]) {
                        currentToolCalls[idx] = { name: '', args: '', id: tc.id || '' };
                    }
                    if (tc.function?.name) currentToolCalls[idx].name += tc.function.name;
                    if (tc.function?.arguments) currentToolCalls[idx].args += tc.function.arguments;
                });
            }
        }

        // 3. Yield Completed Tool Calls
        // OpenAI finishes streaming, we reconstruct the function calls
        const functionCalls: FunctionCall[] = Object.values(currentToolCalls).map(tc => {
            let args = {};
            try {
                args = JSON.parse(tc.args);
            } catch (e) {
                console.error("Failed to parse tool arguments from OpenRouter:", tc.args);
            }
            return {
                name: tc.name,
                args: args
            };
        });

        if (functionCalls.length > 0) {
            yield {
                functionCalls: functionCalls, // Custom property for our internal handler to detect
                candidates: [{
                    content: {
                        parts: functionCalls.map(fc => ({ functionCall: fc })),
                        role: 'model'
                    }
                }]
            } as unknown as GenerateContentResponse;
        }

    } catch (error: any) {
        console.error("OpenRouter API Error:", error);
        throw new ToolError("OpenRouter", "API_ERROR", error.message);
    }
}
