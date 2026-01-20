
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from 'fs';
import path from 'path';
import { parseApiError } from './utils/apiError';
import { getApiKey, getProvider } from './settingsHandler';
import { generateContentWithRetry, generateContentStreamWithRetry } from './utils/geminiUtils';
import { historyControl } from './services/historyControl';
import { transformHistoryToGeminiFormat } from './utils/historyTransformer';
import { streamOpenRouter } from './utils/openRouterUtils';
import { streamOllama } from './utils/ollamaUtils';
import { vectorMemory } from './services/vectorMemory';
import { executeTextToSpeech } from "./tools/tts";

// --- JOB MANAGEMENT SYSTEM ---

interface Job {
    chatId: string;
    messageId: string;
    controller: AbortController;
    clients: Set<any>;
    eventBuffer: string[];
    persistence: ChatPersistenceManager;
    createdAt: number;
}

const activeJobs = new Map<string, Job>();

const writeToClient = (job: Job, type: string, payload: any) => {
    const data = JSON.stringify({ type, payload }) + '\n';
    job.eventBuffer.push(data);
    job.clients.forEach(client => {
        if (!client.writableEnded && !client.closed && !client.destroyed) {
            try {
                client.write(data);
            } catch (e) {
                console.error(`[JOB] Failed to write to client for chat ${job.chatId}`, e);
                job.clients.delete(client);
            }
        }
    });
};

const cleanupJob = (chatId: string) => {
    const job = activeJobs.get(chatId);
    if (job) {
        job.clients.forEach(c => {
            if (!c.writableEnded) c.end();
        });
        activeJobs.delete(chatId);
    }
};

class ChatPersistenceManager {
    private chatId: string;
    private messageId: string;
    private buffer: { text: string } | null = null;
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(chatId: string, messageId: string) {
        this.chatId = chatId;
        this.messageId = messageId;
    }
    addText(delta: string) {
        if (!this.buffer) this.buffer = { text: '' };
        this.buffer.text += delta;
        this.scheduleSave();
    }
    async update(modifier: (response: any) => void) {
        // Implementation for updating tool calls removed as tools are disabled
    }
    private scheduleSave() {
        if (this.saveTimeout) return;
        this.saveTimeout = setTimeout(() => this.flush(), 1500); 
    }
    private async flush() {
        this.saveTimeout = null;
        if (!this.buffer) return;
        const textToAppend = this.buffer.text;
        this.buffer = null; 
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
        } catch (e) { }
    }
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
                    message.isThinking = false;
                    await historyControl.updateChat(this.chatId, { messages: chat.messages });
                }
            }
        } catch (e) {
            console.error(`[PERSISTENCE] Failed to complete save for chat ${this.chatId}:`, e);
        }
    }
}

async function generateProviderCompletion(
    provider: string, 
    apiKey: string | undefined, 
    model: string, 
    prompt: string, 
    systemInstruction?: string,
    jsonMode: boolean = false
): Promise<string> {
    if (provider === 'gemini') {
        if (!apiKey) throw new Error("Gemini API Key missing");
        const ai = new GoogleGenAI({ apiKey });
        const targetModel = model || 'gemini-2.5-flash';
        const config: any = { systemInstruction };
        if (jsonMode) config.responseMimeType = 'application/json';
        
        try {
            const resp = await generateContentWithRetry(ai, {
                model: targetModel,
                contents: prompt,
                config
            });
            return resp.text || '';
        } catch(e) {
            console.error("Gemini completion error:", e);
            return '';
        }
    }
    
    // ... OpenRouter and Ollama simplified handlers ...
    return '';
}

export const apiHandler = async (req: any, res: any) => {
    const task = req.query.task as string;
    
    if (task === 'connect') {
        const { chatId } = req.body; 
        const job = activeJobs.get(chatId);
        
        if (!job) {
            return res.status(200).json({ status: "stream_not_found" });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.flushHeaders();
        
        job.clients.add(res);
        for (const event of job.eventBuffer) {
            res.write(event);
        }
        req.on('close', () => {
            job.clients.delete(res);
        });
        return;
    }

    const activeProvider = await getProvider();
    const activeApiKey = await getApiKey();

    if (!activeApiKey && activeProvider !== 'ollama' && task !== 'cancel') {
        return res.status(401).json({ error: "API key not configured on the server." });
    }
    
    const ai = (activeProvider === 'gemini') && activeApiKey ? new GoogleGenAI({ apiKey: activeApiKey }) : null;

    if (ai) {
        await vectorMemory.init(ai);
    }

    try {
        switch (task) {
            case 'chat': 
            case 'regenerate': {
                const { chatId, model, settings, newMessage, messageId } = req.body;
                
                let savedChat = await historyControl.getChat(chatId);
                if (!savedChat) return res.status(404).json({ error: "Chat not found" });

                let historyMessages = savedChat.messages || [];
                let historyForAI: any[] = [];

                if (task === 'chat' && newMessage) {
                    historyMessages.push(newMessage);
                    if (ai && newMessage.text && newMessage.text.length > 10) {
                        vectorMemory.addMemory(newMessage.text, { chatId, role: 'user' }).catch(console.error);
                    }
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
                    historyForAI = historyMessages.slice(0, -1);
                } else if (task === 'regenerate') {
                     const targetIndex = historyMessages.findIndex((m: any) => m.id === messageId);
                     if (targetIndex !== -1) {
                         historyForAI = historyMessages.slice(0, targetIndex);
                     }
                }

                if (activeJobs.has(chatId)) {
                    const oldJob = activeJobs.get(chatId);
                    oldJob?.controller.abort();
                    activeJobs.delete(chatId);
                }

                const persistence = new ChatPersistenceManager(chatId, messageId);
                const abortController = new AbortController();
                const job: Job = {
                    chatId,
                    messageId,
                    controller: abortController,
                    clients: new Set([res]),
                    eventBuffer: [],
                    persistence,
                    createdAt: Date.now()
                };
                activeJobs.set(chatId, job);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.flushHeaders();

                writeToClient(job, 'start', { requestId: chatId });
                const pingInterval = setInterval(() => writeToClient(job, 'ping', {}), 10000);
                
                req.on('close', () => {
                    job.clients.delete(res);
                });

                let finalSystemInstruction = settings.systemPrompt || "You are a helpful AI assistant.";

                // --- GEMINI HANDLING ---
                if (activeProvider === 'gemini' && ai) {
                    let fullHistory = transformHistoryToGeminiFormat(historyForAI);
                    
                    try {
                        const streamResult = await generateContentStreamWithRetry(ai, {
                            model,
                            contents: fullHistory,
                            config: {
                                temperature: settings.temperature,
                                maxOutputTokens: settings.maxOutputTokens,
                                systemInstruction: finalSystemInstruction
                            }
                        });

                        for await (const chunk of streamResult) {
                            if (abortController.signal.aborted) break;
                            const text = chunk.text();
                            if (text) {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            }
                        }

                        writeToClient(job, 'complete', { finalText: '' }); // Final text logic handled by persistence accumulation
                        persistence.complete((response) => {
                            response.endTime = Date.now();
                        });

                    } catch (loopError) {
                        console.error(`[HANDLER] Stream error:`, loopError);
                        persistence.complete((response) => { response.error = parseApiError(loopError); });
                        writeToClient(job, 'error', parseApiError(loopError));
                    } finally {
                        clearInterval(pingInterval);
                        cleanupJob(chatId);
                    }
                }
                break;
            }
            case 'cancel': {
                const { requestId } = req.body;
                let job = activeJobs.get(requestId);
                if (job) {
                    job.controller.abort();
                    res.status(200).send({ message: 'Cancellation request received.' });
                } else {
                    res.status(404).json({ error: `No active job found` });
                }
                break;
            }
            case 'title': {
                 // Basic title generation logic
                 res.status(200).json({ title: 'New Conversation' });
                 break;
            }
            case 'tts': {
                if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { text, voice, model } = req.body;
                try {
                    const audio = await executeTextToSpeech(ai, text, voice, model);
                    res.status(200).json({ audio });
                } catch (e) {
                    res.status(500).json({ error: parseApiError(e) });
                }
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
