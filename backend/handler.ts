
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from 'fs';
import path from 'path';
import { systemInstruction as agenticSystemInstruction } from "./prompts/system.js";
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona.js';
import { parseApiError } from './utils/apiError.js';
import { executeTextToSpeech } from "./tools/tts.js";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory.js";
import { runAgenticLoop } from './services/agenticLoop/index.js';
import { createToolExecutor } from './tools/index.js';
import { toolDeclarations, codeExecutorDeclaration } from './tools/declarations.js'; // Imported codeExecutorDeclaration
import { getApiKey, getSuggestionApiKey } from './settingsHandler.js';
import { generateContentWithRetry, generateContentStreamWithRetry } from './utils/geminiUtils.js';
import { historyControl } from './services/historyControl.js';
import { transformHistoryToGeminiFormat } from './utils/historyTransformer.js';

// Store promises for frontend tool requests that the backend is waiting on
const frontendToolRequests = new Map<string, (result: any) => void>();

// Store abort controllers for ongoing agentic loops to allow cancellation
const activeAgentLoops = new Map<string, AbortController>();

// Using 'any' for res to bypass type definition mismatches in the environment
const writeEvent = (res: any, type: string, payload: any) => {
    // Only write if the connection is actually open
    if (!res.writableEnded && !res.closed && !res.destroyed) {
        try {
            res.write(JSON.stringify({ type, payload }) + '\n');
        } catch (e) {
            console.error(`[HANDLER] Error writing '${type}' event to stream:`, e);
        }
    }
};

const generateId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

async function generateAsciiTree(dirPath: string, prefix: string = ''): Promise<string> {
    let output = '';
    let entries;
    try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (e) {
        return `${prefix} [Error reading directory]\n`;
    }

    // Filter out hidden files/dirs if necessary, e.g. .DS_Store
    entries = entries.filter(e => !e.name.startsWith('.'));

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        output += `${prefix}${connector}${entry.name}\n`;

        if (entry.isDirectory()) {
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            output += await generateAsciiTree(path.join(dirPath, entry.name), childPrefix);
        }
    }
    return output;
}

async function generateDirectoryStructure(dirPath: string): Promise<any> {
    const name = path.basename(dirPath);
    let stats;
    try {
        stats = await fs.stat(dirPath);
    } catch {
        return null;
    }

    if (stats.isDirectory()) {
        let entries;
        try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
        } catch {
            return null;
        }
        
        // Filter hidden
        const children = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const childPath = path.join(dirPath, entry.name);
            const childNode = await generateDirectoryStructure(childPath);
            if (childNode) children.push(childNode);
        }
        
        return {
            name,
            type: 'directory',
            children
        };
    } else {
        return {
            name,
            type: 'file'
        };
    }
}

// Throttled Saver Class to manage disk writes
class ChatPersistenceManager {
    private chatId: string;
    private messageId: string; // The ID of the model response message
    private buffer: { text: string } | null = null;
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;
    private isSaving = false;

    constructor(chatId: string, messageId: string) {
        this.chatId = chatId;
        this.messageId = messageId;
    }

    // Accumulate text delta
    addText(delta: string) {
        if (!this.buffer) this.buffer = { text: '' };
        this.buffer.text += delta;
        this.scheduleSave();
    }

    // Trigger an immediate update (for tool calls, status changes, etc)
    // This allows passing a modifier function to update the specific message response
    async update(modifier: (response: any) => void) {
        // Flush any pending text first
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        
        try {
            const chat = await historyControl.getChat(this.chatId);
            if (!chat) return;

            const msgIndex = chat.messages.findIndex((m: any) => m.id === this.messageId);
            if (msgIndex !== -1) {
                const message = chat.messages[msgIndex];
                // Ensure responses array exists
                if (message.responses && message.responses[message.activeResponseIndex]) {
                    const activeResponse = message.responses[message.activeResponseIndex];
                    
                    // Apply pending buffer if any
                    if (this.buffer) {
                        activeResponse.text = (activeResponse.text || '') + this.buffer.text;
                        this.buffer = null;
                    }

                    // Apply the specific modification (e.g., adding a tool call event)
                    modifier(activeResponse);

                    await historyControl.updateChat(this.chatId, { messages: chat.messages });
                }
            }
        } catch (e) {
            console.error(`[PERSISTENCE] Failed to update chat ${this.chatId}:`, e);
        }
    }

    // Schedule a debounced save for text chunks
    private scheduleSave() {
        if (this.saveTimeout) return;
        this.saveTimeout = setTimeout(() => this.flush(), 1500); // Save every 1.5s
    }

    private async flush() {
        this.saveTimeout = null;
        if (!this.buffer) return;
        
        const textToAppend = this.buffer.text;
        this.buffer = null; // Clear buffer immediately to capture new typing during await

        try {
            const chat = await historyControl.getChat(this.chatId);
            if (!chat) return;

            const msgIndex = chat.messages.findIndex((m: any) => m.id === this.messageId);
            if (msgIndex !== -1) {
                const message = chat.messages[msgIndex];
                if (message.responses && message.responses[message.activeResponseIndex]) {
                    const activeResponse = message.responses[message.activeResponseIndex];
                    activeResponse.text = (activeResponse.text || '') + textToAppend;
                    await historyControl.updateChat(this.chatId, { messages: chat.messages });
                }
            }
        } catch (e) {
            console.error(`[PERSISTENCE] Failed to flush text to chat ${this.chatId}:`, e);
            // On failure, we might lose that chunk from disk, but in-memory stream usually keeps UI alive.
            // Ideally we'd re-buffer, but simple for now.
        }
    }

    // Force a final save
    async complete(finalModifier?: (response: any) => void) {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        
        try {
            const chat = await historyControl.getChat(this.chatId);
            if (!chat) return;

            const msgIndex = chat.messages.findIndex((m: any) => m.id === this.messageId);
            if (msgIndex !== -1) {
                const message = chat.messages[msgIndex];
                if (message.responses && message.responses[message.activeResponseIndex]) {
                    const activeResponse = message.responses[message.activeResponseIndex];
                    
                    if (this.buffer) {
                        activeResponse.text = (activeResponse.text || '') + this.buffer.text;
                        this.buffer = null;
                    }

                    if (finalModifier) finalModifier(activeResponse);
                    
                    // Mark as done thinking
                    message.isThinking = false;

                    await historyControl.updateChat(this.chatId, { messages: chat.messages });
                }
            }
        } catch (e) {
            console.error(`[PERSISTENCE] Failed to complete save for chat ${this.chatId}:`, e);
        }
    }
}


// Using 'any' for req/res to bypass strict type checks that are failing due to missing properties in the inferred types
export const apiHandler = async (req: any, res: any) => {
    const task = req.query.task as string;
    
    const mainApiKey = await getApiKey();
    const suggestionApiKey = await getSuggestionApiKey();

    // Determine which key to use
    // If it's a suggestion task and we have a specific key for it, use that.
    // Otherwise fallback to main key.
    const SUGGESTION_TASKS = ['title', 'suggestions', 'enhance', 'memory_suggest', 'memory_consolidate'];
    const isSuggestionTask = SUGGESTION_TASKS.includes(task);
    
    let activeApiKey = mainApiKey;
    if (isSuggestionTask && suggestionApiKey) {
        console.log(`[HANDLER] Using Suggestion API Key for task: "${task}"`);
        activeApiKey = suggestionApiKey;
    } else {
        console.log(`[HANDLER] Using Main API Key for task: "${task}"`);
    }

    // Tasks that are allowed to run without an API key
    // 'debug_data_tree' must be here to allow checking file structure without a valid key setup
    const BYPASS_TASKS = ['tool_response', 'cancel', 'debug_data_tree'];

    if (!activeApiKey && !BYPASS_TASKS.includes(task)) {
        console.error(`[HANDLER] API key not configured on server. Blocking task: "${task}"`);
        return res.status(401).json({ error: "API key not configured on the server." });
    }
    
    const ai = activeApiKey ? new GoogleGenAI({ apiKey: activeApiKey }) : null;

    try {
        switch (task) {
            case 'chat': 
            case 'regenerate': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                
                const { chatId, model, settings, newMessage, messageId } = req.body;
                
                console.log(`[HANDLER] Starting ${task} task for chatId: ${chatId}`);

                // 1. Initial Persistence & History Fetch
                // We MUST save the user message and model placeholder immediately to disk.
                // This ensures that if the user refreshes instantly, the chat state is recovered.
                
                let savedChat = await historyControl.getChat(chatId);
                if (!savedChat) {
                    // Recover: If chat ID doesn't exist (race condition?), try create it?
                    // For now, assume valid ID or error.
                    return res.status(404).json({ error: "Chat not found" });
                }

                let historyMessages = savedChat.messages || [];
                
                if (task === 'regenerate' && messageId) {
                    const targetIndex = historyMessages.findIndex((m: any) => m.id === messageId);
                    if (targetIndex !== -1) {
                        // Truncate history up to the user message before this one
                        historyMessages = historyMessages.slice(0, targetIndex);
                    }
                }

                if (task === 'chat' && newMessage) {
                    // Append User Message
                    historyMessages.push(newMessage);
                    
                    // Create and Append Model Placeholder
                    const modelPlaceholder = {
                        id: messageId,
                        role: 'model' as const,
                        text: '',
                        isThinking: true,
                        startTime: Date.now(),
                        responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }],
                        activeResponseIndex: 0
                    };
                    historyMessages.push(modelPlaceholder);

                    // SAVE NOW
                    savedChat = await historyControl.updateChat(chatId, { messages: historyMessages });
                } else if (task === 'regenerate') {
                     // Re-append a fresh model placeholder for the regeneration
                     const modelPlaceholder = {
                        id: messageId,
                        role: 'model' as const,
                        text: '',
                        isThinking: true,
                        startTime: Date.now(),
                        responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }],
                        activeResponseIndex: 0
                    };
                    historyMessages.push(modelPlaceholder);
                    savedChat = await historyControl.updateChat(chatId, { messages: historyMessages });
                }

                if (!savedChat) throw new Error("Failed to initialize chat persistence");

                // Initialize Persistence Manager for this run
                const persistence = new ChatPersistenceManager(chatId, messageId);

                // Prepare History for Gemini (excluding the empty placeholder we just added)
                // The transformer now handles truncation and compression of tool outputs
                const historyForAI = historyMessages.slice(0, -1);
                let fullHistory = transformHistoryToGeminiFormat(historyForAI);

                console.log('[HANDLER] Context Ready:', { 
                    model, 
                    historyLength: fullHistory.length, 
                    isAgentMode: settings.isAgentMode 
                });

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.flushHeaders();

                const requestId = generateId();
                const abortController = new AbortController();
                activeAgentLoops.set(requestId, abortController);
                writeEvent(res, 'start', { requestId });

                const pingInterval = setInterval(() => writeEvent(res, 'ping', {}), 10000);
                
                const sessionCallIds = new Set<string>();

                // handle client disconnect WITHOUT aborting the AI loop
                req.on('close', () => {
                    console.log(`[HANDLER] Client disconnected for request ${requestId}. Continuing execution in background...`);
                    // We DO NOT call abortController.abort() here.
                    // We DO clear the ping interval as the response stream is dead.
                    clearInterval(pingInterval);
                    
                    // Note: We leave sessionCallIds/frontendToolRequests active. 
                    // If the AI calls a frontend tool while user is gone, it will hit the check below.
                });

                const requestFrontendExecution = (callId: string, toolName: string, toolArgs: any) => {
                    return new Promise<string | { error: string }>((resolve) => {
                        // Check if client is still connected
                        if (res.writableEnded || res.closed || res.destroyed) {
                            console.warn(`[HANDLER] Frontend tool ${toolName} requested but client disconnected.`);
                            resolve({ error: "Client disconnected. Cannot execute frontend tool." });
                            return;
                        }

                        // Set a timeout for frontend tools to prevent eternal hanging
                        const timeoutId = setTimeout(() => {
                            if (frontendToolRequests.has(callId)) {
                                console.warn(`[HANDLER] Frontend tool ${toolName} timed out.`);
                                frontendToolRequests.delete(callId);
                                resolve({ error: "Tool execution timed out (User did not respond)." });
                            }
                        }, 60000); // 60s timeout

                        frontendToolRequests.set(callId, (result) => {
                            clearTimeout(timeoutId);
                            resolve(result);
                        });
                        sessionCallIds.add(callId);
                        writeEvent(res, 'frontend-tool-request', { callId, toolName, toolArgs });
                    });
                };
                
                const onToolUpdate = (callId: string, data: any) => {
                    writeEvent(res, 'tool-update', { id: callId, ...data });
                    // We could persist detailed tool logs here if needed, but it might be too verbose for the main chat file.
                    // For now, we only persist the final result or major state changes in the main loop callbacks.
                };
                
                const toolExecutor = createToolExecutor(
                    ai, 
                    settings.imageModel, 
                    settings.videoModel, 
                    activeApiKey!, 
                    chatId, 
                    requestFrontendExecution, 
                    false, 
                    onToolUpdate 
                );

                const finalSettings = {
                    ...settings,
                    systemInstruction: settings.isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction,
                    // In Agent Mode, full tools. In Chat Mode, only Google Search.
                    tools: settings.isAgentMode 
                        ? [{ functionDeclarations: toolDeclarations }] 
                        : [{ googleSearch: {} }],
                };
                
                console.log(`[HANDLER] Running agentic loop... Mode: ${settings.isAgentMode ? 'Agent' : 'Chat'}`);

                try {
                    await runAgenticLoop({
                        ai,
                        model,
                        history: fullHistory, 
                        toolExecutor,
                        callbacks: {
                            onTextChunk: (text) => {
                                writeEvent(res, 'text-chunk', text);
                                persistence.addText(text);
                            },
                            onNewToolCalls: (toolCallEvents) => {
                                writeEvent(res, 'tool-call-start', toolCallEvents);
                                persistence.update((response) => {
                                    // Append new events
                                    response.toolCallEvents = [...(response.toolCallEvents || []), ...toolCallEvents];
                                });
                            },
                            onToolResult: (id, result) => {
                                writeEvent(res, 'tool-call-end', { id, result });
                                persistence.update((response) => {
                                    if (response.toolCallEvents) {
                                        const event = response.toolCallEvents.find((e: any) => e.id === id);
                                        if (event) {
                                            event.result = result;
                                            event.endTime = Date.now();
                                        }
                                    }
                                });
                            },
                            onPlanReady: (plan) => {
                                return new Promise((resolve) => {
                                    if (res.writableEnded || res.closed) {
                                        // If user disconnected during plan, auto-deny or abort?
                                        // Safety: Deny execution if user isn't there to approve.
                                        resolve(false); 
                                        return;
                                    }

                                    const callId = `plan-approval-${generateId()}`;
                                    
                                    // Save plan to history so it's visible if user reloads
                                    persistence.update((response) => {
                                        response.plan = { plan, callId };
                                        // We don't have direct access to 'executionState' on the message here easily without refetching parent,
                                        // but the frontend handles the UI state based on the presence of the plan.
                                        // Ideally, we'd update the message metadata too.
                                    });

                                    frontendToolRequests.set(callId, resolve);
                                    sessionCallIds.add(callId);
                                    writeEvent(res, 'plan-ready', { plan, callId });
                                });
                            },
                            // @ts-ignore
                            // FIX: Add missing onFrontendToolRequest callback to satisfy the type.
                            // This appears to be a stale requirement from a previous refactor, as the
                            // toolExecutor now handles this logic. We add a warning to detect if it's ever called.
                            onFrontendToolRequest: (callId, name, args) => {
                                console.warn(`[HANDLER] onFrontendToolRequest called, but this path is deprecated. Tool: ${name}`);
                            },
                            onComplete: (finalText, groundingMetadata) => {
                                writeEvent(res, 'complete', { finalText, groundingMetadata });
                                persistence.complete((response) => {
                                    response.endTime = Date.now();
                                    if (groundingMetadata) response.groundingMetadata = groundingMetadata;
                                });
                            },
                            onCancel: () => {
                                writeEvent(res, 'cancel', {});
                                persistence.complete(); // Ensure we save whatever we have
                            },
                            onError: (error) => {
                                writeEvent(res, 'error', error);
                                persistence.complete((response) => {
                                    response.error = error;
                                    response.endTime = Date.now();
                                });
                            },
                        },
                        settings: finalSettings,
                        signal: abortController.signal,
                        threadId: requestId,
                    });
                } catch (loopError) {
                    console.error(`[HANDLER] Agentic loop crashed for ${requestId}:`, loopError);
                    persistence.complete((response) => {
                        response.error = parseApiError(loopError);
                    });
                } finally {
                    console.log(`[HANDLER] Finished processing for ${requestId}.`);
                    clearInterval(pingInterval);
                    activeAgentLoops.delete(requestId);
                    if (!res.writableEnded) {
                        res.end();
                    }
                }
                break;
            }

            case 'count_tokens': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { chatId, model, newMessage, isAgentMode } = req.body;

                let fullHistory: any[] = [];
                if (chatId) {
                    const savedChat = await historyControl.getChat(chatId);
                    const historyMessages = savedChat?.messages || [];
                    // Ensure token counting also uses the truncated/transformed history
                    fullHistory = transformHistoryToGeminiFormat(historyMessages);
                }

                if (newMessage && (newMessage.text || (newMessage.attachments && newMessage.attachments.length > 0))) {
                    const newPart = {
                        role: 'user',
                        parts: [
                            ...(newMessage.text ? [{ text: newMessage.text }] : []),
                            ...(newMessage.attachments || []).map((att: any) => ({
                                inlineData: { mimeType: att.mimeType, data: att.data }
                            }))
                        ]
                    };

                    if (fullHistory.length > 0 && fullHistory[fullHistory.length - 1].role === 'user') {
                        (fullHistory[fullHistory.length - 1].parts as any[]).push(...newPart.parts);
                    } else {
                        fullHistory.push(newPart);
                    }
                }

                const systemInstruction = isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
                
                const tools: any[] = isAgentMode 
                    ? [{ functionDeclarations: toolDeclarations }] 
                    : [{ googleSearch: {} }];

                if (fullHistory.length === 0) {
                    fullHistory.push({ role: 'user', parts: [{ text: ' ' }] });
                }

                try {
                    const countResult = await ai.models.countTokens({
                        model: model || 'gemini-2.5-flash',
                        contents: fullHistory,
                        config: {
                            systemInstruction,
                            tools,
                        }
                    });
                    res.status(200).json({ totalTokens: countResult.totalTokens });
                } catch (countError: any) {
                    console.warn(`[HANDLER] countTokens failed: ${countError.message}`);
                    res.status(200).json({ totalTokens: 0, error: "Count failed" });
                }
                break;
            }

            case 'tool_response': {
                const { callId, result, error } = req.body;
                const resolver = frontendToolRequests.get(callId);
                if (resolver) {
                    resolver(error ? { error } : result);
                    frontendToolRequests.delete(callId);
                    res.status(200).send();
                } else {
                    res.status(404).json({ error: `No pending tool request found for callId: ${callId}` });
                }
                break;
            }

            case 'cancel': {
                const { requestId } = req.body;
                const controller = activeAgentLoops.get(requestId);
                if (controller) {
                    controller.abort();
                    activeAgentLoops.delete(requestId);
                    res.status(200).send({ message: 'Cancellation request received.' });
                } else {
                    res.status(404).json({ error: `No active request found for requestId: ${requestId}` });
                }
                break;
            }

            case 'title': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { messages } = req.body;
                const historyText = messages.slice(0, 3).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                const prompt = `You are a helpful assistant. Generate a short, concise title (max 6 words) for this conversation. Do not use quotes or markdown. Just the title text.\n\nCONVERSATION:\n${historyText}\n\nTITLE:`;
                
                try {
                    const response = await generateContentWithRetry(ai, {
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    res.status(200).json({ title: response.text?.trim() ?? '' });
                } catch (e) {
                    console.warn(`[HANDLER] Title generation failed (skipping):`, e);
                    res.status(200).json({ title: '' });
                }
                break;
            }

            case 'suggestions': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { conversation } = req.body;
                const recentHistory = conversation.slice(-5).map((m: any) => `${m.role}: ${(m.text || '').substring(0, 200)}`).join('\n');
                const prompt = `Based on the conversation below, suggest 3 short, relevant follow-up questions or actions the user might want to take next. Return ONLY a JSON array of strings. Example: ["Tell me a more", "Explain the code", "Generate an image"].\n\nCONVERSATION:\n${recentHistory}\n\nJSON SUGGESTIONS:`;
                
                try {
                    const response = await generateContentWithRetry(ai, {
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                        config: { responseMimeType: 'application/json' },
                    });
                    
                    let suggestions = [];
                    try {
                        suggestions = JSON.parse(response.text || '[]');
                    } catch (e) { /* ignore parse error */ }
                    res.status(200).json({ suggestions });
                } catch (e) {
                    console.warn(`[HANDLER] Suggestion generation failed (skipping):`, e);
                    res.status(200).json({ suggestions: [] });
                }
                break;
            }

            case 'tts': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { text, voice, model } = req.body;
                try {
                    const audio = await executeTextToSpeech(ai, text, voice, model);
                    res.status(200).json({ audio });
                } catch (e) {
                    console.error("TTS Failed:", e);
                    res.status(500).json({ error: "TTS Failed" });
                }
                break;
            }
            
            case 'enhance': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { userInput } = req.body;
                
                const prompt = `You are a professional prompt engineer. Your goal is to optimize the user's input for a large language model (LLM) to ensure the best possible response.

                User Input: "${userInput}"

                Instructions:
                1.  **Clarify & Expand:** Make the intent explicit. If the user asks a vague question, add necessary context or specify the desired format (e.g., "explain step-by-step", "provide code examples").
                2.  **Remove Ambiguity:** Replace vague terms with precise terminology.
                3.  **Maintain Voice:** Keep the request in the first person (as if the user is asking).
                4.  **No Fluff:** Do not add conversational filler like "Hello AI" or "Please". Go straight to the request.
                5.  **Preserve Constraints:** If the user specifies a constraint (e.g., "in Python", "short answer"), strictly keep it.
                6.  **Short Inputs:** If the input is already simple/optimal or just a greeting ("Hi", "Hello"), return it exactly as is.

                Optimized Prompt:`;
                
                res.setHeader('Content-Type', 'text/plain');
                try {
                    // Use gemini-3-flash-preview as recommended for basic text tasks
                    const stream = await generateContentStreamWithRetry(ai, {
                        model: 'gemini-3-flash-preview',
                        contents: prompt,
                    });
                    for await (const chunk of stream) {
                        const text = chunk.text || '';
                        if (text) res.write(text);
                    }
                } catch (e) {
                    console.error("Prompt enhance failed:", e);
                    res.write(userInput); // Fallback to original
                }
                res.end();
                break;
            }

            case 'memory_suggest': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { conversation } = req.body;
                try {
                    const suggestions = await executeExtractMemorySuggestions(ai, conversation);
                    res.status(200).json({ suggestions });
                } catch (e) {
                    console.warn(`[HANDLER] Memory suggest failed (skipping):`, e);
                    res.status(200).json({ suggestions: [] });
                }
                break;
            }

            case 'memory_consolidate': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { currentMemory, suggestions } = req.body;
                try {
                    const memory = await executeConsolidateMemory(ai, currentMemory, suggestions);
                    res.status(200).json({ memory });
                } catch (e) {
                    console.warn(`[HANDLER] Memory consolidate failed:`, e);
                    // Fallback to simple append
                    res.status(200).json({ memory: [currentMemory, ...suggestions].filter(Boolean).join('\n') });
                }
                break;
            }
            
            case 'tool_exec': {
                 if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { toolName, toolArgs, chatId } = req.body;
                // Pass empty strings for optional models, and TRUE for skipFrontendCheck
                // This forces the backend implementation to run, breaking the frontend delegation loop
                const toolExecutor = createToolExecutor(
                    ai, 
                    '', 
                    '', 
                    activeApiKey!, 
                    chatId, 
                    async () => ({error: 'Frontend execution not supported in this context'}), 
                    true // skipFrontendCheck
                );
                // Manually pass a dummy ID if needed
                const result = await toolExecutor(toolName, toolArgs, 'manual-exec');
                res.status(200).json({ result });
                break;
            }

            case 'debug_data_tree': {
                const dataPath = path.join((process as any).cwd(), 'data');
                const ascii = `data/\n` + await generateAsciiTree(dataPath);
                const structure = await generateDirectoryStructure(dataPath);
                res.status(200).json({ ascii, json: structure });
                break;
            }

            default:
                res.status(404).json({ error: `Unknown task: ${task}` });
        }
    } catch (error) {
        console.error(`[HANDLER] Error processing task "${task}":`, error);
        const parsedError = parseApiError(error);
        if (!res.headersSent) {
            res.status(500).json({ error: parsedError });
        }
    }
};
