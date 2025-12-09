
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'hono';
import { stream } from 'hono/streaming';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { systemInstruction as agenticSystemInstruction } from "./prompts/system.js";
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona.js';
import { parseApiError } from './utils/apiError.js';
import { executeTextToSpeech } from "./tools/tts.js";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory.js";
import { runAgenticLoop } from './services/agenticLoop/index.js';
import { createToolExecutor } from './tools/index.js';
import { toolDeclarations } from './tools/declarations.js';
import { getApiKey } from './settingsHandler.js';
import { generateContentWithRetry, generateContentStreamWithRetry } from './utils/geminiUtils.js';
import { isNode, getFs } from './utils/platform.js';

const frontendToolRequests = new Map<string, (result: any) => void>();
const activeAgentLoops = new Map<string, AbortController>();

const generateId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

async function generateAsciiTree(dirPath: string, prefix: string = ''): Promise<string> {
    const fs = await getFs();
    if (!fs) return "FileSystem debug not supported in this environment.";
    
    let output = '';
    let entries;
    try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (e) {
        return `${prefix} [Error reading directory]\n`;
    }
    entries = entries.filter((e: any) => !e.name.startsWith('.'));

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

export const apiHandler = async (c: Context) => {
    const task = c.req.query('task');
    console.log(`[HANDLER] Received request for task: "${task}"`);

    // Pass context 'c' to getApiKey so it can check c.env
    const apiKey = await getApiKey(c);
    const BYPASS_TASKS = ['tool_response', 'cancel', 'debug_data_tree'];

    if (!apiKey && !BYPASS_TASKS.includes(task || '')) {
        return c.json({ error: "API key not configured on the server." }, 401);
    }
    
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

    try {
        switch (task) {
            case 'chat': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const body = await c.req.json();
                const { chatId, model, history, settings } = body;

                return stream(c, async (stream) => {
                    const requestId = generateId();
                    const abortController = new AbortController();
                    activeAgentLoops.set(requestId, abortController);

                    const writeEvent = async (type: string, payload: any) => {
                        await stream.write(JSON.stringify({ type, payload }) + '\n');
                    };

                    await writeEvent('start', { requestId });
                    const pingInterval = setInterval(() => writeEvent('ping', {}), 10000);

                    stream.onAbort(() => {
                        console.log(`[HANDLER] Client disconnected for request ${requestId}.`);
                        abortController.abort();
                        activeAgentLoops.delete(requestId);
                        clearInterval(pingInterval);
                    });

                    const requestFrontendExecution = (callId: string, toolName: string, toolArgs: any) => {
                        return new Promise<string | { error: string }>((resolve) => {
                            frontendToolRequests.set(callId, resolve);
                            writeEvent('frontend-tool-request', { callId, toolName, toolArgs });
                        });
                    };

                    const onToolUpdate = (callId: string, data: any) => {
                        writeEvent('tool-update', { id: callId, ...data });
                    };

                    const toolExecutor = createToolExecutor(
                        ai, settings.imageModel, settings.videoModel, apiKey!, chatId, 
                        requestFrontendExecution, false, onToolUpdate
                    );

                    const finalSettings = {
                        ...settings,
                        systemInstruction: settings.isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction,
                        tools: settings.isAgentMode ? [{ functionDeclarations: toolDeclarations }] : [{ googleSearch: {} }],
                    };

                    try {
                        await runAgenticLoop({
                            ai, model, history, toolExecutor,
                            callbacks: {
                                onTextChunk: (text) => writeEvent('text-chunk', text),
                                onNewToolCalls: (events) => writeEvent('tool-call-start', events),
                                onToolResult: (id, result) => writeEvent('tool-call-end', { id, result }),
                                onPlanReady: (plan) => {
                                    return new Promise((resolve) => {
                                        const callId = `plan-approval-${generateId()}`;
                                        frontendToolRequests.set(callId, resolve);
                                        writeEvent('plan-ready', { plan, callId });
                                    });
                                },
                                onComplete: (finalText, groundingMetadata) => writeEvent('complete', { finalText, groundingMetadata }),
                                onCancel: () => writeEvent('cancel', {}),
                                onError: (error) => writeEvent('error', error),
                            },
                            settings: finalSettings,
                            signal: abortController.signal,
                            threadId: requestId,
                        });
                    } catch (e: any) {
                        if (e.message !== 'AbortError') console.error(e);
                    } finally {
                        clearInterval(pingInterval);
                        activeAgentLoops.delete(requestId);
                    }
                });
            }

            case 'tool_response': {
                const body = await c.req.json();
                const { callId, result, error } = body;
                const resolver = frontendToolRequests.get(callId);
                if (resolver) {
                    resolver(error ? { error } : result);
                    frontendToolRequests.delete(callId);
                    return c.body(null, 200);
                }
                return c.json({ error: `No pending tool request found for callId: ${callId}` }, 404);
            }

            case 'cancel': {
                const body = await c.req.json();
                const { requestId } = body;
                const controller = activeAgentLoops.get(requestId);
                if (controller) {
                    controller.abort();
                    activeAgentLoops.delete(requestId);
                    return c.json({ message: 'Cancellation request received.' });
                }
                return c.json({ error: 'No active request found.' }, 404);
            }

            case 'title': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { messages } = await c.req.json();
                const historyText = messages.slice(0, 3).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                const prompt = `Generate a short, concise title (max 6 words) for this conversation. No quotes.\n\nCONVERSATION:\n${historyText}\n\nTITLE:`;
                const response = await generateContentWithRetry(ai, { model: 'gemini-2.5-flash', contents: prompt });
                return c.json({ title: response.text.trim() });
            }

            case 'suggestions': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { conversation } = await c.req.json();
                const recentHistory = conversation.slice(-5).map((m: any) => `${m.role}: ${(m.text || '').substring(0, 200)}`).join('\n');
                const prompt = `Based on the conversation, suggest 3 short follow-up actions. Return JSON string array. Example: ["Explain more", "Generate image"].\n\nCONVERSATION:\n${recentHistory}\n\nJSON:`;
                const response = await generateContentWithRetry(ai, { model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
                return c.json({ suggestions: JSON.parse(response.text) });
            }

            case 'tts': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { text, voice, model } = await c.req.json();
                const audio = await executeTextToSpeech(ai, text, voice, model);
                return c.json({ audio });
            }

            case 'enhance': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { userInput } = await c.req.json();
                const prompt = `Rewrite this prompt to be more detailed and specific for an LLM:\n\n"${userInput}"\n\nREWRITTEN:`;
                
                return stream(c, async (stream) => {
                    const result = await generateContentStreamWithRetry(ai, { model: 'gemini-2.5-flash', contents: prompt });
                    for await (const chunk of result) {
                        await stream.write(chunk.text);
                    }
                });
            }

            case 'memory_suggest': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { conversation } = await c.req.json();
                const suggestions = await executeExtractMemorySuggestions(ai, conversation);
                return c.json({ suggestions });
            }

            case 'memory_consolidate': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { currentMemory, suggestions } = await c.req.json();
                const memory = await executeConsolidateMemory(ai, currentMemory, suggestions);
                return c.json({ memory });
            }

            case 'placeholder': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { conversationContext, isAgentMode } = await c.req.json();
                const prompt = `Generate one short engaging placeholder question for a chat input. Context: "${conversationContext}". Mode: ${isAgentMode ? 'Agent' : 'Chat'}.`;
                const response = await generateContentWithRetry(ai, { model: 'gemini-2.5-flash', contents: prompt });
                return c.json({ placeholder: response.text.replace(/"/g, '') });
            }

            case 'tool_exec': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { toolName, toolArgs, chatId } = await c.req.json();
                const toolExecutor = createToolExecutor(ai, '', '', apiKey!, chatId, async () => ({error: 'Frontend exec not supported'}), true);
                const result = await toolExecutor(toolName, toolArgs, 'manual-exec');
                return c.json({ result });
            }

            case 'debug_data_tree': {
                if (isNode) {
                    const dataPath = path.join((process as any).cwd(), 'data');
                    const tree = `data/\n` + await generateAsciiTree(dataPath);
                    return c.json({ tree });
                }
                return c.json({ tree: "Not supported in this environment." });
            }

            default:
                return c.json({ error: `Unknown task: ${task}` }, 404);
        }
    } catch (error) {
        console.error(`[HANDLER] Error processing task "${task}":`, error);
        return c.json({ error: parseApiError(error) }, 500);
    }
};
