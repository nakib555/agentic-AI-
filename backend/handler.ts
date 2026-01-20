
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
import { generateContentWithRetry, generateContentStreamWithRetry, getText } from './utils/geminiUtils';
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
                    
                    // Safety check for empty history
                    if (!fullHistory || fullHistory.length === 0) {
                        // Fallback: If no history, try to reconstruct from newMessage if available, else error
                        if (newMessage && newMessage.text) {
                             fullHistory = [{ role: 'user', parts: [{ text: newMessage.text }] }];
                        } else {
                             throw new Error("Contents are required: Conversation history is empty.");
                        }
                    }

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
                            
                            // Safe text access
                            const text = getText(chunk);
                            if (text) {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            }
                        }

                        writeToClient(job, 'complete', { finalText: '' });
                        persistence.complete((response) => {
                            response.endTime = Date.now();
                        });

                    } catch (loopError) {
                        console.error(`[HANDLER] Stream error:`, loopError);
                        const apiError = parseApiError(loopError);
                        persistence.complete((response) => { response.error = apiError; });
                        writeToClient(job, 'error', apiError);
                    } finally {
                        clearInterval(pingInterval);
                        cleanupJob(chatId);
                    }
                }
                
                // --- OPENROUTER HANDLING ---
                else if (activeProvider === 'openrouter') {
                    const callbacks = {
                        onTextChunk: (text: string) => {
                            if (!abortController.signal.aborted) {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            }
                        },
                        onComplete: (fullText: string) => {
                            writeToClient(job, 'complete', { finalText: fullText });
                            persistence.complete((response) => { response.endTime = Date.now(); });
                            clearInterval(pingInterval);
                            cleanupJob(chatId);
                        },
                        onError: (error: any) => {
                            const err = parseApiError(error);
                            persistence.complete((response) => { response.error = err; });
                            writeToClient(job, 'error', err);
                            clearInterval(pingInterval);
                            cleanupJob(chatId);
                        }
                    };

                    const openRouterHistory = historyForAI.map((m: any) => ({
                        role: m.role,
                        parts: [{ text: m.text }] // Adapter for internal structure
                    }));
                    // Insert System prompt at the start
                    if (finalSystemInstruction) {
                        openRouterHistory.unshift({ role: 'system', parts: [{ text: finalSystemInstruction }] });
                    }

                    streamOpenRouter(
                        activeApiKey || '',
                        model,
                        openRouterHistory,
                        callbacks,
                        {
                            temperature: settings.temperature,
                            maxTokens: settings.maxOutputTokens
                        }
                    );
                }

                // --- OLLAMA HANDLING ---
                else if (activeProvider === 'ollama') {
                    const callbacks = {
                        onTextChunk: (text: string) => {
                            if (!abortController.signal.aborted) {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            }
                        },
                        onComplete: (fullText: string) => {
                            writeToClient(job, 'complete', { finalText: fullText });
                            persistence.complete((response) => { response.endTime = Date.now(); });
                            clearInterval(pingInterval);
                            cleanupJob(chatId);
                        },
                        onError: (error: any) => {
                            const err = parseApiError(error);
                            persistence.complete((response) => { response.error = err; });
                            writeToClient(job, 'error', err);
                            clearInterval(pingInterval);
                            cleanupJob(chatId);
                        }
                    };

                    const ollamaHistory = historyForAI.map((m: any) => ({
                        role: m.role,
                        parts: [{ text: m.text }]
                    }));
                    if (finalSystemInstruction) {
                        ollamaHistory.unshift({ role: 'system', parts: [{ text: finalSystemInstruction }] });
                    }

                    streamOllama(
                        activeApiKey,
                        model,
                        ollamaHistory,
                        callbacks,
                        {
                            temperature: settings.temperature,
                            host: process.env.OLLAMA_HOST // Optional env override
                        }
                    );
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
                    // Send 200 even if not found to avoid client-side errors for idempotent requests
                    res.status(200).json({ message: 'Job not found or already completed.' });
                }
                break;
            }
            case 'title': {
                 const { messages, model } = req.body;
                 if (!ai) {
                     res.status(200).json({ title: 'New Conversation' });
                     return;
                 }

                 const historyText = (messages || []).slice(0, 5).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                 const prompt = `Generate a concise, 3-5 word title for this chat conversation. Return ONLY the title text, no quotes or markdown.\n\nConversation:\n${historyText}`;

                 try {
                     const result = await generateContentWithRetry(ai, {
                         model: model || 'gemini-2.5-flash',
                         contents: [{ role: 'user', parts: [{ text: prompt }] }],
                     });
                     const title = (result.text || 'New Chat').trim().replace(/^["']|["']$/g, '');
                     res.status(200).json({ title });
                 } catch (e) {
                     console.error("Title generation failed:", e);
                     res.status(200).json({ title: 'New Conversation' });
                 }
                 break;
            }
            case 'suggestions': {
                const { conversation, model } = req.body;
                if (!ai) {
                    res.status(200).json({ suggestions: [] });
                    return;
                }
                
                const historyText = (conversation || []).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                const prompt = `Given the conversation below, generate 3 short, relevant follow-up questions the user might ask next. Return ONLY a JSON array of strings. \n\nConversation:\n${historyText}`;
                
                try {
                    const result = await generateContentWithRetry(ai, {
                        model: model || 'gemini-2.5-flash',
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: { responseMimeType: 'application/json' }
                    });
                    const text = result.text || '[]';
                    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
                    const suggestions = JSON.parse(jsonStr);
                    res.status(200).json({ suggestions });
                } catch (e) {
                    console.error("Suggestions failed:", e);
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
