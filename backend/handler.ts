
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
import { toolDeclarations } from './tools/declarations.js';
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
    if (!res.writableEnded && !res.closed) {
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

                // 1. Fetch History
                const savedChat = await historyControl.getChat(chatId);
                let historyMessages = savedChat?.messages || [];
                
                if (task === 'regenerate' && messageId) {
                    const targetIndex = historyMessages.findIndex((m: any) => m.id === messageId);
                    if (targetIndex !== -1) {
                        historyMessages = historyMessages.slice(0, targetIndex);
                    }
                }

                let fullHistory = transformHistoryToGeminiFormat(historyMessages);

                // 2. Append new message (only for 'chat' task)
                if (task === 'chat' && newMessage) {
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
                        fullHistory.push(newPart as any);
                    }
                }

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

                req.on('close', () => {
                    console.log(`[HANDLER] Client disconnected for request ${requestId}. Aborting loop.`);
                    abortController.abort();
                    activeAgentLoops.delete(requestId);
                    clearInterval(pingInterval);
                    sessionCallIds.forEach(callId => {
                        const resolver = frontendToolRequests.get(callId);
                        if (resolver) {
                            resolver({ error: "Client disconnected during tool execution" });
                            frontendToolRequests.delete(callId);
                        }
                    });
                });

                const requestFrontendExecution = (callId: string, toolName: string, toolArgs: any) => {
                    return new Promise<string | { error: string }>((resolve) => {
                        frontendToolRequests.set(callId, resolve);
                        sessionCallIds.add(callId);
                        writeEvent(res, 'frontend-tool-request', { callId, toolName, toolArgs });
                    });
                };
                
                const onToolUpdate = (callId: string, data: any) => {
                    writeEvent(res, 'tool-update', { id: callId, ...data });
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
                    tools: settings.isAgentMode ? [{ functionDeclarations: toolDeclarations }] : [{ googleSearch: {} }],
                };
                
                console.log(`[HANDLER] Running agentic loop... Mode: ${settings.isAgentMode ? 'Agent' : 'Chat'}`);

                await runAgenticLoop({
                    ai,
                    model,
                    history: fullHistory, 
                    toolExecutor,
                    callbacks: {
                        onTextChunk: (text) => writeEvent(res, 'text-chunk', text),
                        onNewToolCalls: (toolCallEvents) => writeEvent(res, 'tool-call-start', toolCallEvents),
                        onToolResult: (id, result) => writeEvent(res, 'tool-call-end', { id, result }),
                        onPlanReady: (plan) => {
                            return new Promise((resolve) => {
                                const callId = `plan-approval-${generateId()}`;
                                frontendToolRequests.set(callId, resolve);
                                sessionCallIds.add(callId);
                                writeEvent(res, 'plan-ready', { plan, callId });
                            });
                        },
                        onWorkflowUpdate: (workflow) => writeEvent(res, 'workflow-update', workflow),
                        onComplete: (finalText, groundingMetadata) => writeEvent(res, 'complete', { finalText, groundingMetadata }),
                        onCancel: () => writeEvent(res, 'cancel', {}),
                        onError: (error) => writeEvent(res, 'error', error),
                    },
                    settings: finalSettings,
                    signal: abortController.signal,
                    threadId: requestId,
                });

                console.log(`[HANDLER] Agentic loop completed for ${requestId}.`);
                clearInterval(pingInterval);
                activeAgentLoops.delete(requestId);
                res.end();
                break;
            }

            case 'count_tokens': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { chatId, model, newMessage, isAgentMode } = req.body;

                let fullHistory: any[] = [];
                if (chatId) {
                    const savedChat = await historyControl.getChat(chatId);
                    const historyMessages = savedChat?.messages || [];
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
                
                // For token counting, we should include tool declarations even in chat mode if the history
                // potentially contains tool usage (from previous agent mode turns).
                // Safest approach for accurate counting is to include them if agent mode is on,
                // OR if we suspect history has tools.
                // To prevent "function call without declaration" errors during counting, we enable tools globally for counting.
                // We merge googleSearch and functionDeclarations.
                
                const tools: any[] = [{ functionDeclarations: toolDeclarations }];
                if (!isAgentMode) {
                    // If specifically in chat mode, also add googleSearch capabilities to estimation
                    tools.push({ googleSearch: {} });
                }

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
                    // Return 0 or null instead of 500 to avoid crashing frontend logic
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
                    res.status(200).json({ title: response.text.trim() });
                } catch (e) {
                    console.warn(`[HANDLER] Title generation failed (skipping):`, e);
                    // Return OK to prevent error noise in frontend
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
                        suggestions = JSON.parse(response.text);
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
                const prompt = `You are a prompt rewriting expert. Rewrite the following user input to be more detailed, specific, and clear for a large language model. Expand on the user's intent. Do not add conversational filler. Just provide the rewritten prompt.\n\nUSER INPUT: "${userInput}"\n\nREWRITTEN PROMPT:`;
                
                res.setHeader('Content-Type', 'text/plain');
                try {
                    const stream = await generateContentStreamWithRetry(ai, {
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    for await (const chunk of stream) {
                        res.write(chunk.text);
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
