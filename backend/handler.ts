
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from 'fs';
import path from 'path';
import { systemInstruction as agenticSystemInstruction } from "./prompts/system";
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona';
import { parseApiError } from './utils/apiError';
import { executeTextToSpeech } from "./tools/tts";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory";
import { runAgenticLoop } from './services/agenticLoop/index';
import { createToolExecutor } from './tools/index';
import { toolDeclarations } from './tools/declarations'; 
import { getApiKey, getProvider, getGeminiApiKey } from './settingsHandler';
import { generateContentWithRetry, generateContentStreamWithRetry } from './utils/geminiUtils';
import { historyControl } from './services/historyControl';
import { transformHistoryToGeminiFormat } from './utils/historyTransformer';
import { vectorMemory } from './services/vectorMemory';
import { executeWithPiston } from './tools/piston';

// Import the new Provider Registry
import { getProvider as getAIProvider } from './providers/registry';

// ... (Job Management code remains the same: activeJobs, writeToClient, cleanupJob, generateId, ChatPersistenceManager) ...
// Store promises for frontend tool requests that the backend is waiting on
const frontendToolRequests = new Map<string, (result: any) => void>();

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

const generateId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

async function generateAsciiTree(dirPath: string, prefix: string = ''): Promise<string> {
    let output = '';
    let entries;
    try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (e) {
        return `${prefix} [Error reading directory]\n`;
    }
    entries = entries.filter(e => !e.name.startsWith('.'));
    entries.sort((a, b) => {
        if (a.isDirectory() === b.isDirectory()) {
            return a.name.localeCompare(b.name);
        }
        return a.isDirectory() ? -1 : 1;
    });
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
    try { stats = await fs.stat(dirPath); } catch { return null; }
    if (stats.isDirectory()) {
        let entries;
        try { entries = await fs.readdir(dirPath, { withFileTypes: true }); } catch { return null; }
        const children = [];
        entries.sort((a, b) => {
            if (a.isDirectory() === b.isDirectory()) { return a.name.localeCompare(b.name); }
            return a.isDirectory() ? -1 : 1;
        });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const childPath = path.join(dirPath, entry.name);
            const childNode = await generateDirectoryStructure(childPath);
            if (childNode) children.push(childNode);
        }
        return { name, type: 'directory', children };
    } else {
        return { name, type: 'file' };
    }
}

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
                if (message.responses && message.responses[message.activeResponseIndex]) {
                    const activeResponse = message.responses[message.activeResponseIndex];
                    if (this.buffer) {
                        activeResponse.text = (activeResponse.text || '') + this.buffer.text;
                        this.buffer = null;
                    }
                    modifier(activeResponse);
                    await historyControl.updateChat(this.chatId, { messages: chat.messages });
                }
            }
        } catch (e) {
            console.error(`[PERSISTENCE] Failed to update chat ${this.chatId}:`, e);
        }
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
    
    // --- RECONNECTION ---
    if (task === 'connect') {
        const { chatId } = req.body; 
        const job = activeJobs.get(chatId);
        
        if (!job) return res.status(200).json({ status: "stream_not_found" });
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.flushHeaders();
        job.clients.add(res);
        for (const event of job.eventBuffer) res.write(event);
        req.on('close', () => job.clients.delete(res));
        return;
    }

    // --- CREDENTIALS ---
    const activeProviderId = await getProvider();
    const mainApiKey = await getApiKey(); 
    const geminiApiKey = await getGeminiApiKey();

    const BYPASS_TASKS = ['tool_response', 'cancel', 'debug_data_tree', 'run_piston', 'feedback'];
    if (!mainApiKey && !BYPASS_TASKS.includes(task)) {
        return res.status(401).json({ error: "API key not configured on the server." });
    }

    // Auxiliary AI (Always Gemini for Tools/RAG if available)
    const auxAi = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
    if (auxAi) await vectorMemory.init(auxAi);

    try {
        switch (task) {
            case 'chat': 
            case 'regenerate': {
                const { chatId, model, settings, newMessage, messageId } = req.body;
                
                // --- HISTORY & PERSISTENCE ---
                let savedChat = await historyControl.getChat(chatId);
                if (!savedChat) return res.status(404).json({ error: "Chat not found" });

                let historyMessages = savedChat.messages || [];
                let historyForAI: any[] = [];

                if (task === 'chat' && newMessage) {
                    historyMessages.push(newMessage);
                    if (auxAi && newMessage.text && newMessage.text.length > 10) {
                        vectorMemory.addMemory(newMessage.text, { chatId, role: 'user' }).catch(console.error);
                    }
                    const modelPlaceholder = {
                        id: messageId, role: 'model' as const, text: '', isThinking: true, startTime: Date.now(),
                        responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }], activeResponseIndex: 0
                    };
                    historyMessages.push(modelPlaceholder);
                    await historyControl.updateChat(chatId, { messages: historyMessages });
                    historyForAI = historyMessages.slice(0, -1);
                } else if (task === 'regenerate') {
                     const targetIndex = historyMessages.findIndex((m: any) => m.id === messageId);
                     if (targetIndex !== -1) {
                         historyForAI = historyMessages.slice(0, targetIndex);
                     } else {
                         // Fallback logic
                         const modelPlaceholder = {
                            id: messageId, role: 'model' as const, text: '', isThinking: true, startTime: Date.now(),
                            responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }], activeResponseIndex: 0
                        };
                        historyMessages.push(modelPlaceholder);
                        await historyControl.updateChat(chatId, { messages: historyMessages });
                        historyForAI = historyMessages.slice(0, -1);
                     }
                }

                // --- JOB SETUP ---
                if (activeJobs.has(chatId)) {
                    activeJobs.get(chatId)?.controller.abort();
                    activeJobs.delete(chatId);
                }

                const persistence = new ChatPersistenceManager(chatId, messageId);
                const abortController = new AbortController();
                const job: Job = {
                    chatId, messageId, controller: abortController,
                    clients: new Set([res]), eventBuffer: [], persistence, createdAt: Date.now()
                };
                activeJobs.set(chatId, job);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.flushHeaders();
                writeToClient(job, 'start', { requestId: chatId });
                const pingInterval = setInterval(() => writeToClient(job, 'ping', {}), 10000);
                req.on('close', () => job.clients.delete(res));

                // --- SYSTEM PROMPT & RAG ---
                let ragContext = "";
                if (auxAi && newMessage && newMessage.text) {
                    const relevant = await vectorMemory.retrieveRelevant(newMessage.text);
                    if (relevant.length > 0) ragContext = `\n## 🧠 RELEVANT MEMORIES\n${relevant.join('\n')}\n`;
                }

                const coreInstruction = settings.isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
                const { systemPrompt, aboutUser, aboutResponse, memoryContent } = settings;
                
                let contextLayer = "";
                if (aboutUser) contextLayer += `\n## 👤 USER\n${aboutUser}\n`;
                if (aboutResponse) contextLayer += `\n## 🎭 STYLE\n${aboutResponse}\n`;
                if (memoryContent) contextLayer += `\n## 🧠 MEMORY\n${memoryContent}\n`;
                if (systemPrompt) contextLayer += `\n## 🔧 DIRECTIVES\n${systemPrompt}\n`;
                if (ragContext) contextLayer += ragContext;

                const finalSystemInstruction = contextLayer 
                    ? `${coreInstruction}\n\n# 🧩 CONTEXTUAL LAYER\n${contextLayer}`
                    : coreInstruction;

                // --- STRATEGY SELECTION ---
                // 1. Agent Mode (Currently specialized to Gemini due to complex function calling)
                // 2. Chat Mode (Uses the Provider Registry)

                if (settings.isAgentMode && activeProviderId === 'gemini') {
                    // --- AGENTIC LOOP (GEMINI SPECIFIC) ---
                    if (!auxAi) throw new Error("Gemini AI not initialized for agent mode.");
                    
                    const fullHistory = transformHistoryToGeminiFormat(historyForAI);
                    const toolExecutor = createToolExecutor(auxAi, settings.imageModel, settings.videoModel, geminiApiKey!, chatId, (callId, toolName, toolArgs) => {
                        return new Promise((resolve) => {
                            if (abortController.signal.aborted) { resolve({ error: "Job aborted." }); return; }
                            const timeoutId = setTimeout(() => {
                                if (frontendToolRequests.has(callId)) {
                                    frontendToolRequests.delete(callId);
                                    resolve({ error: "Tool execution timed out." });
                                }
                            }, 60000); 
                            frontendToolRequests.set(callId, (result) => { clearTimeout(timeoutId); resolve(result); });
                            writeToClient(job, 'frontend-tool-request', { callId, toolName, toolArgs });
                        });
                    }, false, (id, data) => writeToClient(job, 'tool-update', { id, ...data }));

                    try {
                        await runAgenticLoop({
                            ai: auxAi,
                            model,
                            history: fullHistory, 
                            toolExecutor,
                            callbacks: {
                                onTextChunk: (text) => { writeToClient(job, 'text-chunk', text); persistence.addText(text); },
                                onNewToolCalls: (events) => { writeToClient(job, 'tool-call-start', events); persistence.update(r => r.toolCallEvents = [...(r.toolCallEvents||[]), ...events]); },
                                onToolResult: (id, res) => { writeToClient(job, 'tool-call-end', { id, result: res }); persistence.update(r => r.toolCallEvents?.find((e: any) => e.id === id) && (r.toolCallEvents.find((e: any) => e.id === id).result = res)); },
                                onPlanReady: (plan) => new Promise((resolve) => {
                                    const callId = `plan-approval-${generateId()}`;
                                    persistence.update(r => r.plan = { plan, callId });
                                    frontendToolRequests.set(callId, resolve);
                                    writeToClient(job, 'plan-ready', { plan, callId });
                                }),
                                onFrontendToolRequest: () => {},
                                onComplete: (text, meta) => {
                                    writeToClient(job, 'complete', { finalText: text, groundingMetadata: meta });
                                    persistence.complete(r => { r.endTime = Date.now(); if(meta) r.groundingMetadata = meta; });
                                    if (text.length > 50) vectorMemory.addMemory(text, { chatId, role: 'model' }).catch(console.error);
                                },
                                onCancel: () => { writeToClient(job, 'cancel', {}); persistence.complete(); },
                                onError: (err) => { writeToClient(job, 'error', err); persistence.complete(r => r.error = err); },
                            },
                            settings: { ...settings, systemInstruction: finalSystemInstruction, tools: [{ functionDeclarations: toolDeclarations }] },
                            signal: abortController.signal,
                            threadId: chatId,
                        });
                    } catch (e) {
                         const err = parseApiError(e);
                         writeToClient(job, 'error', err);
                         persistence.complete(r => r.error = err);
                    } finally {
                        clearInterval(pingInterval);
                        cleanupJob(chatId);
                    }
                } else {
                    // --- UNIVERSAL CHAT MODE (ALL PROVIDERS) ---
                    // This uses the new Provider Registry Pattern
                    try {
                        const providerInstance = getAIProvider(activeProviderId);
                        
                        await providerInstance.chatStream(
                            mainApiKey!, 
                            model, 
                            historyForAI, 
                            { 
                                temperature: settings.temperature,
                                maxTokens: settings.maxOutputTokens,
                                systemInstruction: finalSystemInstruction 
                            },
                            {
                                onTextChunk: (text) => {
                                    writeToClient(job, 'text-chunk', text);
                                    persistence.addText(text);
                                },
                                onComplete: (text) => {
                                    writeToClient(job, 'complete', { finalText: text });
                                    persistence.complete(r => r.endTime = Date.now());
                                    if (text.length > 50 && auxAi) vectorMemory.addMemory(text, { chatId, role: 'model' }).catch(console.error);
                                },
                                onError: (err) => {
                                    const parsed = parseApiError(err);
                                    writeToClient(job, 'error', parsed);
                                    persistence.complete(r => r.error = parsed);
                                }
                            }
                        );
                    } catch (e: any) {
                         const parsed = parseApiError(e);
                         writeToClient(job, 'error', parsed);
                         persistence.complete(r => r.error = parsed);
                    } finally {
                        clearInterval(pingInterval);
                        cleanupJob(chatId);
                    }
                }
                break;
            }
            // ... (Rest of tasks: tool_response, cancel, etc. remain unchanged) ...
            case 'tool_response': {
                const { callId, result, error } = req.body;
                const resolver = frontendToolRequests.get(callId);
                if (resolver) {
                    resolver(error ? { error } : result);
                    frontendToolRequests.delete(callId);
                    res.status(200).send();
                } else {
                    res.status(404).json({ error: `No pending tool request for ${callId}` });
                }
                break;
            }
            case 'cancel': {
                const { requestId } = req.body;
                const job = activeJobs.get(requestId);
                if (job) {
                    job.controller.abort();
                    res.status(200).send({ message: 'Cancelled.' });
                } else {
                    res.status(404).json({ error: 'Job not found' });
                }
                break;
            }
            // ... (Other auxiliary tasks like tts, title, etc. which use auxAi/Gemini) ...
            case 'title': {
                 if (!auxAi) return res.status(200).json({ title: '' });
                 const { messages } = req.body;
                 const historyText = messages.slice(0, 3).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                 const prompt = `Generate a short concise title (max 6 words).\n\nCONVERSATION:\n${historyText}\n\nTITLE:`;
                 try {
                     const resp = await generateContentWithRetry(auxAi, { model: 'gemini-2.5-flash', contents: prompt });
                     res.status(200).json({ title: resp.text?.trim() ?? '' });
                 } catch (e) { res.status(200).json({ title: '' }); }
                 break;
            }
            // ... keep other tasks (suggestions, tts, etc) ...
            case 'suggestions': {
                if (!auxAi) return res.status(200).json({ suggestions: [] });
                // ... same implementation ...
                const { conversation } = req.body;
                const recentHistory = conversation.slice(-5).map((m: any) => `${m.role}: ${(m.text || '').substring(0, 200)}`).join('\n');
                const prompt = `Suggest 3 short follow-up questions. Return JSON array of strings.\n\nCONVERSATION:\n${recentHistory}\n\nJSON SUGGESTIONS:`;
                try {
                    const response = await generateContentWithRetry(auxAi, { model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
                    let suggestions = [];
                    try { suggestions = JSON.parse(response.text || '[]'); } catch (e) {}
                    res.status(200).json({ suggestions });
                } catch (e) { res.status(200).json({ suggestions: [] }); }
                break;
            }
            case 'tts': {
                if (!auxAi) throw new Error("Gemini AI required for TTS.");
                const { text, voice, model } = req.body;
                const audio = await executeTextToSpeech(auxAi, text, voice, model);
                res.status(200).json({ audio });
                break;
            }
            case 'enhance': {
                 if (!auxAi) return res.status(200).send(req.body.userInput);
                 const { userInput } = req.body;
                 // ... enhancement logic ...
                 const prompt = `Rewrite to be effective LLM prompt:\n"${userInput}"\nOUTPUT:`;
                 res.setHeader('Content-Type', 'text/plain');
                 try {
                    const stream = await generateContentStreamWithRetry(auxAi, { model: 'gemini-2.5-flash', contents: prompt });
                    for await (const chunk of stream) res.write(chunk.text || '');
                 } catch(e) { res.write(userInput); }
                 res.end();
                 break;
            }
            // ... memory tools ...
            case 'memory_suggest': {
                if (!auxAi) return res.status(200).json({ suggestions: [] });
                const suggestions = await executeExtractMemorySuggestions(auxAi, req.body.conversation);
                res.status(200).json({ suggestions });
                break;
            }
            case 'memory_consolidate': {
                if (!auxAi) return res.status(200).json({ memory: '' });
                const memory = await executeConsolidateMemory(auxAi, req.body.currentMemory, req.body.suggestions);
                res.status(200).json({ memory });
                break;
            }
            case 'run_piston': {
                const result = await executeWithPiston(req.body.language, req.body.code);
                res.status(200).json({ result });
                break;
            }
            case 'tool_exec': {
                // ... used for Veo check mostly ...
                if (!auxAi) throw new Error("Gemini AI required.");
                const toolExecutor = createToolExecutor(auxAi, '', '', geminiApiKey!, req.body.chatId, async () => ({error:'N/A'}), true);
                const result = await toolExecutor(req.body.toolName, req.body.toolArgs, 'manual');
                res.status(200).json({ result });
                break;
            }
            case 'debug_data_tree': {
                const dataPath = path.join((process as any).cwd(), 'data');
                res.status(200).json({ ascii: await generateAsciiTree(dataPath), json: await generateDirectoryStructure(dataPath) });
                break;
            }
            default: res.status(404).json({ error: `Unknown task: ${task}` });
        }
    } catch (error) {
        console.error(`[HANDLER] Error in ${task}:`, error);
        if (!res.headersSent) res.status(500).json({ error: parseApiError(error) });
    }
};
