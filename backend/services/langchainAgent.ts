/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { parseApiError } from "../utils/apiError";

// --- Types ---

type StreamCallbacks = {
    onTextChunk: (text: string) => void;
    onNewToolCalls: (toolCallEvents: any[]) => void;
    onToolResult: (id: string, result: string) => void;
    onComplete: (finalText: string, groundingMetadata: any) => void;
    onError: (error: any) => void;
};

// --- Tool Wrapper ---

/**
 * Wraps existing backend tool implementations into LangChain DynamicStructuredTools.
 */
const getLangChainTools = (
    toolExecutor: (name: string, args: any, id: string) => Promise<string>
) => {
    // Helper to create a tool
    const mkTool = (name: string, description: string, schema: z.ZodType<any>) => {
        return new DynamicStructuredTool({
            name,
            description,
            schema,
            func: async (args, runManager) => {
                // We use the existing toolExecutor which handles the actual logic
                // Pass the runId as the tool ID for tracking
                return await toolExecutor(name, args, runManager?.runId || 'unknown');
            },
        });
    };

    return [
        mkTool("duckduckgoSearch", "Search the web for information. Use this for current events or general knowledge.", z.object({
            query: z.string().describe("The search query"),
        })),
        mkTool("calculator", "Evaluate mathematical expressions.", z.object({
            expression: z.string().describe("The math expression to evaluate"),
        })),
        mkTool("executeCode", "Execute code in a sandbox (Python, JS, etc). Use this for data analysis, complex math, or generating visualizations.", z.object({
            language: z.string().describe("The programming language (python, javascript, etc)"),
            code: z.string().describe("The code to execute"),
            rationale: z.string().optional().describe("Reasoning for this code"),
            packages: z.array(z.string()).optional().describe("Python packages to install"),
            input_filenames: z.array(z.string()).optional().describe("Files to make available"),
        })),
        mkTool("generateImage", "Generate an image description. Use this when the user asks for a picture.", z.object({
            prompt: z.string().describe("Image description"),
            aspectRatio: z.string().optional().describe("Aspect ratio (1:1, 16:9, etc)"),
        })),
        mkTool("generateVideo", "Generate a video. Use this when the user asks for a video.", z.object({
            prompt: z.string().describe("Video description"),
            aspectRatio: z.string().optional(),
            resolution: z.string().optional(),
        })),
        mkTool("browser", "Browse a URL. Use this to read documentation or verify facts from a specific link.", z.object({
            url: z.string().describe("URL to visit"),
            action: z.enum(['read', 'screenshot', 'click', 'type', 'scroll', 'wait']).optional().default('read'),
            selector: z.string().optional(),
            text: z.string().optional(),
        })),
        mkTool("listFiles", "List files in virtual fs.", z.object({
            path: z.string().describe("Path to list (default /main/output)"),
        })),
        mkTool("writeFile", "Write content to a file.", z.object({
            path: z.string().describe("File path"),
            content: z.string().describe("File content"),
        })),
        mkTool("displayFile", "Display a file to the user.", z.object({
            path: z.string().describe("File path"),
        })),
        mkTool("deleteFile", "Delete a file.", z.object({
            path: z.string().describe("File path"),
        })),
        mkTool("displayMap", "Show a map.", z.object({
            latitude: z.number(),
            longitude: z.number(),
            zoom: z.number().optional(),
            markerText: z.string().optional(),
        })),
        mkTool("analyzeImageVisually", "Analyze an image.", z.object({
            filePath: z.string().optional(),
            imageBase64: z.string().optional(),
        })),
        mkTool("captureCodeOutputScreenshot", "Screenshot code output.", z.object({
            outputId: z.string(),
        })),
        mkTool("getCurrentLocation", "Get user location.", z.object({})),
        mkTool("requestLocationPermission", "Request location permission.", z.object({})),
    ];
};

// --- Agent Runner ---

export const runLangChainAgent = async (
    provider: 'gemini' | 'openrouter',
    modelName: string,
    history: any[], // Content[] from Gemini SDK, which we will parse
    toolExecutor: (name: string, args: any, id: string) => Promise<string>,
    callbacks: StreamCallbacks,
    settings: any,
    apiKey: string,
    chatId: string
) => {
    try {
        console.log(`[LangChain] Starting agent with model: ${modelName} (${provider})`);

        let model: any; // BaseChatModel

        if (provider === 'gemini') {
            model = new ChatGoogleGenerativeAI({
                modelName: modelName,
                apiKey: apiKey,
                maxOutputTokens: settings.maxOutputTokens || undefined,
                temperature: settings.temperature,
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ],
            });
        } else {
            // OpenRouter Configuration
            model = new ChatOpenAI({
                modelName: modelName,
                openAIApiKey: apiKey,
                configuration: {
                    baseURL: "https://openrouter.ai/api/v1",
                    defaultHeaders: {
                        "HTTP-Referer": "https://agentic-ai-chat.local",
                        "X-Title": "Agentic AI Chat",
                    }
                },
                temperature: settings.temperature,
                maxTokens: settings.maxOutputTokens || undefined,
                streaming: true,
            });
        }

        // 2. Setup Tools
        const tools = getLangChainTools(toolExecutor);

        // 3. Create Agent
        const agent = createToolCallingAgent({
            llm: model,
            tools,
            prompt: await import("langchain/prompts").then(m => 
                m.ChatPromptTemplate.fromMessages([
                    new SystemMessage(settings.systemInstruction || "You are a helpful AI assistant."),
                    ["placeholder", "{chat_history}"],
                    ["human", "{input}"],
                    ["placeholder", "{agent_scratchpad}"],
                ])
            ),
        });

        const executor = new AgentExecutor({
            agent,
            tools,
            verbose: true,
            maxIterations: 15, // Safety limit
        });

        // 4. Convert History
        // The history passed in is likely Gemini 'Content[]' format.
        // We need to convert it to LangChain's BaseMessage[]
        const langChainHistory: BaseMessage[] = [];
        let inputMessage = "";

        for (let i = 0; i < history.length; i++) {
            const msg = history[i];
            
            // Extract text from parts
            let text = "";
            if (msg.parts) {
                text = msg.parts.map((p: any) => p.text || "").join("");
            }

            // If it's the last message and from user, it's the input
            if (i === history.length - 1 && msg.role === 'user') {
                inputMessage = text;
                continue;
            }

            if (msg.role === 'user') {
                langChainHistory.push(new HumanMessage(text));
            } else {
                langChainHistory.push(new AIMessage(text));
            }
        }
        
        // 5. Run & Stream
        const eventStream = await executor.streamEvents(
            { input: inputMessage, chat_history: langChainHistory },
            { version: "v2" }
        );

        let finalAnswer = "";

        for await (const event of eventStream) {
            const eventType = event.event;

            if (eventType === "on_chat_model_stream") {
                const chunk = event.data.chunk;
                // Check if it's a tool call chunk or text chunk
                if (chunk.content && typeof chunk.content === 'string') {
                    callbacks.onTextChunk(chunk.content);
                    finalAnswer += chunk.content;
                }
            } 
            else if (eventType === "on_tool_start") {
                // Map LangChain tool start to our format
                const toolCallEvents = [{
                    id: event.run_id,
                    call: {
                        name: event.name,
                        args: event.data.input
                    },
                    startTime: Date.now()
                }];
                callbacks.onNewToolCalls(toolCallEvents);
            } 
            else if (eventType === "on_tool_end") {
                // Map result
                callbacks.onToolResult(event.run_id, String(event.data.output));
            }
        }
        
        callbacks.onComplete(finalAnswer, null);

    } catch (error: any) {
        console.error("[LangChain] Agent execution failed:", error);
        callbacks.onError(parseApiError(error));
    }
};