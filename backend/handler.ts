
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona';
import { parseApiError } from './utils/apiError';
import { executeTextToSpeech } from "./tools/tts";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory";
import { createToolExecutor } from './tools/index';
import { getApiKey, getProvider } from './settingsHandler';
import { generateProviderCompletion } from './utils/generateProviderCompletion';
import { historyControl } from './services/historyControl';
import { vectorMemory } from './services/vectorMemory';
import { executeWithPiston } from './tools/piston';
import { readData, SETTINGS_FILE_PATH } from './data-store';
import { providerRegistry } from './providers/registry'; // New Registry Import
import { GoogleGenAI } from "@google/genai"; // Still needed for TTS and Tools initialization if provider relies on it

// Store promises for frontend tool requests that the backend is waiting on
const frontendToolRequests = new Map<string, (result: any) => void>();

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

const generateId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ... (Keep existing generateAsciiTree and generateDirectoryStructure functions) ...
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
    
    // --- RECONNECTION HANDLING ---
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
        console.log(`[HANDLER] Client reconnected to job ${chatId}`);
        
        for (const event of job.eventBuffer) {
            res.write(event);
        }
        
        req.on('close', () => {
            job.clients.delete(res);
        });
        
        return;
    }

    const activeProviderName = await getProvider();
    const mainApiKey = await getApiKey();
    const activeApiKey = mainApiKey;
    
    const globalSettings: any = await readData(SETTINGS_FILE_PATH);
    const activeModel = globalSettings.activeModel || 'gemini-2.5-flash';

    const isSuggestionTask = ['title', 'suggestions', 'enhance', 'memory_suggest', 'memory_consolidate', 'run_piston'].includes(task);
    const BYPASS_TASKS = ['tool_response', 'cancel', 'debug_data_tree', 'run_piston', 'feedback', 'tool_exec'];
    
    if (!activeApiKey && !BYPASS_TASKS.includes(task) && !isSuggestionTask && activeProviderName !== 'ollama') {
        return res.status(401).json({ error: "API key not configured on the server." });
    }
    
    // AI instance still needed for VectorMemory and TTS (Gemini based)
    const ai = (activeApiKey) ? new GoogleGenAI({ apiKey: activeApiKey }) : null;

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
                     } else {
                         // Fallback creation
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
                     }
                }

                if (activeJobs.has(chatId)) {
                    console.log(`[HANDLER] Cancelling existing job for ${chatId}`);
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
                
                req.on('close', () => { job.clients.delete(res); });

                let ragContext = "";
                if (ai && newMessage && newMessage.text) {
                    try {
                        const relevantMemories = await vectorMemory.retrieveRelevant(newMessage.text);
                        if (relevantMemories.length > 0) {
                            ragContext = `\n## 🧠 RELEVANT MEMORIES (RAG)\nThe following past information may be relevant:\n- ${relevantMemories.join('\n- ')}\n\n`;
                        }
                    } catch (e) {
                        console.error("[RAG] Retrieval failed:", e);
                    }
                }

                const coreInstruction = chatModeSystemInstruction;
                const { systemPrompt, aboutUser, aboutResponse, memoryContent } = settings;
                
                let personalizationSection = "";
                if (aboutUser?.trim()) personalizationSection += `\n## 👤 USER PROFILE & CONTEXT\n${aboutUser.trim()}\n`;
                if (aboutResponse?.trim()) personalizationSection += `\n## 🎭 RESPONSE STYLE\n${aboutResponse.trim()}\n`;
                if (memoryContent?.trim()) personalizationSection += `\n## 🧠 CORE MEMORY\n${memoryContent.trim()}\n`;
                if (systemPrompt?.trim()) personalizationSection += `\n## 🔧 CUSTOM DIRECTIVES\n${systemPrompt.trim()}\n`;
                if (ragContext) personalizationSection += ragContext;

                let finalSystemInstruction = coreInstruction;
                if (personalizationSection) {
                    finalSystemInstruction = `
# ⚙️ SYSTEM KERNEL (IMMUTABLE PROTOCOLS)
${coreInstruction}

================================================================================

# 🧩 CONTEXTUAL LAYER (PERSONALIZATION)
${personalizationSection}
`.trim();
                }

                // --- PROVIDER DISPATCH ---
                try {
                    const provider = await providerRegistry.getProvider(activeProviderName);

                    const requestFrontendExecution = (callId: string, toolName: string, toolArgs: any) => {
                        return new Promise<string | { error: string }>((resolve) => {
                            if (abortController.signal.aborted) {
                                resolve({ error: "Job aborted." });
                                return;
                            }
                            const timeoutId = setTimeout(() => {
                                if (frontendToolRequests.has(callId)) {
                                    frontendToolRequests.delete(callId);
                                    resolve({ error: "Tool execution timed out." });
                                }
                            }, 60000); 
                            frontendToolRequests.set(callId, (result) => {
                                clearTimeout(timeoutId);
                                resolve(result);
                            });
                            writeToClient(job, 'frontend-tool-request', { callId, toolName, toolArgs });
                        });
                    };

                    const onToolUpdate = (callId: string, data: any) => {
                        writeToClient(job, 'tool-update', { id: callId, ...data });
                    };

                    // Only create tool executor if we have Gemini AI instance (since many backend tools rely on it)
                    // If AI is null (e.g. OpenRouter), tool executor won't work for some tools, provider handles grace.
                    const toolExecutor = ai ? createToolExecutor(ai, settings.imageModel, settings.videoModel, activeApiKey!, chatId, requestFrontendExecution, false, onToolUpdate) : undefined;

                    await provider.chat({
                        model,
                        messages: historyForAI,
                        newMessage,
                        systemInstruction: finalSystemInstruction,
                        temperature: settings.temperature,
                        maxTokens: settings.maxOutputTokens,
                        apiKey: activeApiKey,
                        isAgentMode: false,
                        toolExecutor,
                        signal: abortController.signal,
                        chatId,
                        callbacks: {
                            onTextChunk: (text) => {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            },
                            onNewToolCalls: (events) => {
                                writeToClient(job, 'tool-call-start', events);
                                persistence.update((r) => { r.toolCallEvents = [...(r.toolCallEvents || []), ...events]; });
                            },
                            onToolResult: (id, result) => {
                                writeToClient(job, 'tool-call-end', { id, result });
                                persistence.update((r) => { 
                                    const event = r.toolCallEvents?.find((e: any) => e.id === id);
                                    if(event) { event.result = result; event.endTime = Date.now(); }
                                });
                            },
                            onPlanReady: (plan) => {
                                return new Promise((resolve) => {
                                    if (abortController.signal.aborted) { resolve(false); return; }
                                    const callId = `plan-approval-${generateId()}`;
                                    persistence.update((r) => { r.plan = { plan, callId }; });
                                    frontendToolRequests.set(callId, resolve);
                                    writeToClient(job, 'plan-ready', { plan, callId });
                                });
                            },
                            onFrontendToolRequest: (callId, name, args) => {},
                            onComplete: (data) => {
                                writeToClient(job, 'complete', data);
                                persistence.complete((r) => {
                                    r.endTime = Date.now();
                                    if (data.groundingMetadata) r.groundingMetadata = data.groundingMetadata;
                                });
                                if (data.finalText.length > 50 && ai) {
                                    vectorMemory.addMemory(data.finalText, { chatId, role: 'model' }).catch(console.error);
                                }
                            },
                            onError: (err) => {
                                const parsed = parseApiError(err);
                                writeToClient(job, 'error', parsed);
                                persistence.complete((r) => { r.error = parsed; r.endTime = Date.now(); });
                            },
                            onCancel: () => {
                                writeToClient(job, 'cancel', {});
                                persistence.complete();
                            }
                        }
                    });

                } catch (e: any) {
                    console.error(`[HANDLER] Chat logic failed:`, e);
                    const parsedError = parseApiError(e);
                    writeToClient(job, 'error', parsedError);
                    persistence.complete((response) => { response.error = parsedError; });
                } finally {
                    clearInterval(pingInterval);
                    cleanupJob(chatId);
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
                let job = activeJobs.get(requestId);
                if (job) {
                    job.controller.abort();
                    res.status(200).send({ message: 'Cancellation request received.' });
                } else {
                    res.status(404).json({ error: `No active job found for ID: ${requestId}` });
                }
                break;
            }
            case 'feedback': {
                const { chatId, messageId, feedback } = req.body;
                console.log(`[FEEDBACK] Chat: ${chatId}, Msg: ${messageId}, Rating: ${feedback}`);
                res.status(200).json({ status: 'ok' });
                break;
            }
            case 'title': {
                const { messages, model } = req.body;
                const historyText = messages.slice(0, 3).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                const prompt = `Generate a short concise title (max 6 words) for this conversation.\n\nCONVERSATION:\n${historyText}\n\nTITLE:`;
                const title = await generateProviderCompletion(activeProviderName, activeApiKey, model, prompt);
                res.status(200).json({ title: title.trim() });
                break;
            }
            case 'suggestions': {
                const { conversation, model } = req.body;
                const recentHistory = conversation.slice(-5).map((m: any) => `${m.role}: ${(m.text || '').substring(0, 200)}`).join('\n');
                const prompt = `Suggest 3 short follow-up questions. Return JSON array of strings. Do not use markdown code blocks.\n\nCONVERSATION:\n${recentHistory}\n\nJSON SUGGESTIONS:`;
                try {
                    const text = await generateProviderCompletion(activeProviderName, activeApiKey, model, prompt, undefined, true);
                    let suggestions = [];
                    try { 
                        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
                        suggestions = JSON.parse(cleanText || '[]'); 
                    } catch (e) {}
                    if (!Array.isArray(suggestions)) suggestions = [];
                    res.status(200).json({ suggestions });
                } catch (e) { res.status(200).json({ suggestions: [] }); }
                break;
            }
            case 'tts': {
                if (!ai) throw new Error("GoogleGenAI not initialized (Required for TTS).");
                const { text, voice, model } = req.body;
                try {
                    const audio = await executeTextToSpeech(ai, text, voice, model);
                    res.status(200).json({ audio });
                } catch (e) {
                    res.status(500).json({ error: parseApiError(e) });
                }
                break;
            }
            case 'enhance': {
                const { userInput } = req.body;
                const prompt = `
You are an expert Prompt Engineer. Rewrite this input into a highly effective prompt.

USER INPUT: "${userInput}"

Output ONLY the raw text of the improved prompt.
`;
                res.setHeader('Content-Type', 'text/plain');
                try {
                    const text = await generateProviderCompletion(activeProviderName, activeApiKey, 'gemini-3-flash-preview', prompt); 
                    res.write(text);
                } catch (e) { res.write(userInput); }
                res.end();
                break;
            }
            case 'memory_suggest': {
                const { conversation } = req.body;
                try {
                    const suggestions = await executeExtractMemorySuggestions(activeProviderName, activeApiKey, activeModel, conversation);
                    res.status(200).json({ suggestions });
                } catch (e) { res.status(200).json({ suggestions: [] }); }
                break;
            }
            case 'memory_consolidate': {
                const { currentMemory, suggestions } = req.body;
                try {
                    const memory = await executeConsolidateMemory(activeProviderName, activeApiKey, activeModel, currentMemory, suggestions);
                    res.status(200).json({ memory });
                } catch (e) { res.status(200).json({ memory: [currentMemory, ...suggestions].filter(Boolean).join('\n') }); }
                break;
            }
            case 'run_piston': {
                const { language, code } = req.body;
                try {
                    const result = await executeWithPiston(language, code);
                    res.status(200).json({ result });
                } catch (error: any) {
                    res.status(500).json({ error: error.message });
                }
                break;
            }
            case 'tool_exec': {
                 if (!ai) throw new Error("GoogleGenAI not initialized.");
                const { toolName, toolArgs, chatId } = req.body;
                const toolExecutor = createToolExecutor(ai, '', '', activeApiKey!, chatId, async () => ({error: 'Frontend execution not supported'}), true);
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
