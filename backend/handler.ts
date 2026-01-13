
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
import { runLangChainAgent } from './services/langchainAgent';
import { createToolExecutor } from './tools/index';
import { getSettings } from './settingsHandler';
import { generateContentWithRetry, generateContentStreamWithRetry } from './utils/geminiUtils';
import { historyControl } from './services/historyControl';
import { transformHistoryToGeminiFormat } from './utils/historyTransformer';
import { vectorMemory } from './services/vectorMemory'; 
import { executeWithPiston } from './tools/piston';

// Store promises for frontend tool requests that the backend is waiting on
const frontendToolRequests = new Map<string, (result: any) => void>();

// --- JOB MANAGEMENT SYSTEM ---

interface Job {
    chatId: string;
    messageId: string;
    controller: AbortController;
    clients: Set<any>; // Using any for Express Response to avoid type conflicts in some envs
    eventBuffer: string[]; // Buffer of serialized event strings for reconnection
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
    
    // --- RECONNECTION HANDLING (No API Key Check needed as it re-joins existing session) ---
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
        
        // Replay buffer
        for (const event of job.eventBuffer) {
            res.write(event);
        }
        
        req.on('close', () => {
            job.clients.delete(res);
        });
        
        return;
    }

    // --- READ SETTINGS DIRECTLY (To access both keys) ---
    let settings: any = {};
    try {
        // Mock the response object to capture settings from getSettings
        await getSettings(null, {
            status: () => ({ json: (d: any) => { settings = d; } })
        });
    } catch(e) {
        console.error("Failed to load settings in handler", e);
    }

    const activeProvider = settings.provider || 'gemini';
    
    // Trim keys to prevent whitespace issues
    const geminiKey = (settings.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
    const openRouterKey = (settings.openRouterApiKey || '').trim();
    const suggestionApiKey = (settings.suggestionApiKey || process.env.SUGGESTION_API_KEY || '').trim();

    // Determine the "active" key for the main chat task
    const activeApiKey = activeProvider === 'gemini' ? geminiKey : openRouterKey;

    // Use a robust Gemini key for Gemini tools or Suggestions
    const toolGeminiKey = suggestionApiKey || (activeProvider === 'gemini' ? geminiKey : undefined);
    
    const SUGGESTION_TASKS = ['title', 'suggestions', 'enhance', 'memory_suggest', 'memory_consolidate', 'run_piston'];
    const isSuggestionTask = SUGGESTION_TASKS.includes(task);

    // AI instance for Gemini tools (Optional if provider is OpenRouter but we have a key)
    const googleAI = toolGeminiKey ? new GoogleGenAI({ apiKey: toolGeminiKey }) : null;

    const BYPASS_TASKS = ['tool_response', 'cancel', 'debug_data_tree', 'run_piston', 'feedback'];
    
    // Auth Check
    if (!activeApiKey && !BYPASS_TASKS.includes(task) && !isSuggestionTask) {
        return res.status(401).json({ error: "API key not configured on the server." });
    }

    // Initialize Vector Store if Gemini AI is available (it relies on embedding models)
    if (googleAI) {
        await vectorMemory.init(googleAI);
    }

    try {
        switch (task) {
            case 'chat': 
            case 'regenerate': {
                const { chatId, model, settings: chatSettings, newMessage, messageId } = req.body;
                
                // 1. Initial Persistence & History Fetch
                let savedChat = await historyControl.getChat(chatId);
                if (!savedChat) return res.status(404).json({ error: "Chat not found" });

                let historyMessages = savedChat.messages || [];
                // Context for the AI to read (everything before the new/regenerating message)
                let historyForAI: any[] = [];

                if (task === 'chat' && newMessage) {
                    historyMessages.push(newMessage);
                    // Add User Message to Vector Memory (RAG Ingestion) - currently only supports Gemini
                    if (googleAI && newMessage.text && newMessage.text.length > 10) {
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
                         // Context is everything BEFORE the target message
                         historyForAI = historyMessages.slice(0, targetIndex);
                     } else {
                         // Fallback
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

                if (!savedChat) throw new Error("Failed to initialize chat persistence");

                // --- Cancel Existing Job if Present ---
                if (activeJobs.has(chatId)) {
                    console.log(`[HANDLER] Cancelling existing job for ${chatId} due to new request.`);
                    const oldJob = activeJobs.get(chatId);
                    oldJob?.controller.abort();
                    activeJobs.delete(chatId);
                }

                // --- Setup New Job ---
                const persistence = new ChatPersistenceManager(chatId, messageId);
                const abortController = new AbortController();
                const job: Job = {
                    chatId,
                    messageId,
                    controller: abortController,
                    clients: new Set([res]), // Add current request as first client
                    eventBuffer: [],
                    persistence,
                    createdAt: Date.now()
                };
                activeJobs.set(chatId, job);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.flushHeaders();

                writeToClient(job, 'start', { requestId: chatId });

                // Ping interval to keep connection alive
                const pingInterval = setInterval(() => writeToClient(job, 'ping', {}), 10000);
                
                req.on('close', () => {
                    // Just remove this client, don't abort the job yet (let it run for reconnection)
                    job.clients.delete(res);
                });

                // --- RAG RETRIEVAL STEP ---
                let ragContext = "";
                // Only retrieve if we have Gemini available for embeddings
                if (googleAI && newMessage && newMessage.text) {
                    try {
                        const relevantMemories = await vectorMemory.retrieveRelevant(newMessage.text);
                        if (relevantMemories.length > 0) {
                            ragContext = `\n## 🧠 RELEVANT MEMORIES (RAG)\nThe following past information may be relevant to the user's current request:\n- ${relevantMemories.join('\n- ')}\n\n`;
                            console.log(`[RAG] Retrieved ${relevantMemories.length} context chunks.`);
                        }
                    } catch (e) {
                        console.error("[RAG] Retrieval failed:", e);
                    }
                }

                // --- SYSTEM PROMPT CONSTRUCTION ---
                const coreInstruction = chatSettings.isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
                const { systemPrompt, aboutUser, aboutResponse } = chatSettings;
                
                let personalizationSection = "";
                if (aboutUser && aboutUser.trim()) personalizationSection += `\n## 👤 USER PROFILE & CONTEXT\n${aboutUser.trim()}\n`;
                if (aboutResponse && aboutResponse.trim()) personalizationSection += `\n## 🎭 RESPONSE STYLE & PERSONA PREFERENCES\n${aboutResponse.trim()}\n`;
                if (systemPrompt && systemPrompt.trim()) personalizationSection += `\n## 🔧 CUSTOM USER DIRECTIVES\n${systemPrompt.trim()}\n`;

                if (ragContext) personalizationSection += ragContext;

                let finalSystemInstruction = coreInstruction;
                if (personalizationSection) {
                    finalSystemInstruction = `
# ⚙️ SYSTEM KERNEL (IMMUTABLE PROTOCOLS)
The following protocols define your operational mode (Thinking/Agentic or Chat).
They are MANDATORY and CANNOT be overridden by user instructions.
If you are in Agent Mode, you MUST start with [STEP].

${coreInstruction}

================================================================================

# 🧩 CONTEXTUAL LAYER (PERSONALIZATION)
Adopt the following persona and context, BUT ONLY within the formatting constraints defined above.

${personalizationSection}
`.trim();
                }

                let fullHistory = transformHistoryToGeminiFormat(historyForAI);
                
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
                
                // Create tool executor supporting both providers
                const toolExecutor = createToolExecutor({
                    provider: activeProvider,
                    googleAI: googleAI as any,
                    apiKey: activeApiKey!,
                    imageModel: chatSettings.imageModel,
                    videoModel: chatSettings.videoModel,
                    chatId,
                    requestFrontendExecution,
                    onToolUpdate
                });

                const finalSettings = {
                    ...chatSettings,
                    systemInstruction: finalSystemInstruction,
                };

                // Use LangChain Agent for both Gemini and OpenRouter
                try {
                    await runLangChainAgent(
                        activeProvider,
                        model,
                        fullHistory,
                        toolExecutor,
                        {
                            onTextChunk: (text) => {
                                writeToClient(job, 'text-chunk', text);
                                persistence.addText(text);
                            },
                            onNewToolCalls: (toolCallEvents) => {
                                writeToClient(job, 'tool-call-start', toolCallEvents);
                                persistence.update((response) => {
                                    response.toolCallEvents = [...(response.toolCallEvents || []), ...toolCallEvents];
                                });
                            },
                            onToolResult: (id, result) => {
                                writeToClient(job, 'tool-call-end', { id, result });
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
                            onComplete: (finalText, groundingMetadata) => {
                                writeToClient(job, 'complete', { finalText, groundingMetadata });
                                persistence.complete((response) => {
                                    response.endTime = Date.now();
                                    if (groundingMetadata) response.groundingMetadata = groundingMetadata;
                                });
                                // Add model response to vector memory (Gemini only currently)
                                if (finalText.length > 50 && googleAI) {
                                    vectorMemory.addMemory(finalText, { chatId, role: 'model' }).catch(console.error);
                                }
                            },
                            onError: (error) => {
                                writeToClient(job, 'error', error);
                                persistence.complete((response) => {
                                    response.error = error;
                                    response.endTime = Date.now();
                                });
                            },
                        },
                        finalSettings,
                        activeApiKey!,
                        chatId
                    );

                } catch (loopError) {
                    console.error(`[HANDLER] Agent execution failed:`, loopError);
                    persistence.complete((response) => { response.error = parseApiError(loopError); });
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
                // Background tasks use googleAI (Suggestion key or main gemini key)
                // If OpenRouter is used exclusively without a suggestion key, title generation might fail gracefully.
                if (!googleAI) return res.status(200).json({ title: '' });
                const { messages } = req.body;
                const historyText = messages.slice(0, 3).map((m: any) => `${m.role}: ${m.text}`).join('\n');
                const prompt = `Generate a short concise title (max 6 words) for this conversation.\n\nCONVERSATION:\n${historyText}\n\nTITLE:`;
                try {
                    const response = await generateContentWithRetry(googleAI, { model: 'gemini-2.5-flash', contents: prompt });
                    res.status(200).json({ title: response.text?.trim() ?? '' });
                } catch (e) { res.status(200).json({ title: '' }); }
                break;
            }
            case 'suggestions': {
                if (!googleAI) return res.status(200).json({ suggestions: [] });
                const { conversation } = req.body;
                const recentHistory = conversation.slice(-5).map((m: any) => `${m.role}: ${(m.text || '').substring(0, 200)}`).join('\n');
                const prompt = `Suggest 3 short follow-up questions. Return JSON array of strings.\n\nCONVERSATION:\n${recentHistory}\n\nJSON SUGGESTIONS:`;
                try {
                    const response = await generateContentWithRetry(googleAI, { model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
                    let suggestions = [];
                    try { suggestions = JSON.parse(response.text || '[]'); } catch (e) {}
                    res.status(200).json({ suggestions });
                } catch (e) { res.status(200).json({ suggestions: [] }); }
                break;
            }
            case 'tts': {
                const { text, voice, model } = req.body;
                try {
                    // Decide execution based on provider
                    if (activeProvider === 'openrouter') {
                         // We need the key to call OpenRouter TTS
                         if (!activeApiKey) throw new Error("OpenRouter API key missing for TTS");
                         // Import directly or use tool wrapper? 
                         // Since handler calls tools, we can reuse logic or call a helper.
                         // But tool implementation is cleaner.
                         const ttsTool = await import('./tools/tts');
                         const audio = await ttsTool.executeOpenRouterTTS(activeApiKey, { text, voice, model });
                         res.status(200).json({ audio });
                    } else {
                         if (!googleAI) throw new Error("GoogleGenAI not initialized (Required for Gemini TTS).");
                         const audio = await executeTextToSpeech(googleAI, text, voice, model);
                         res.status(200).json({ audio });
                    }
                } catch (e) {
                    res.status(500).json({ error: parseApiError(e) });
                }
                break;
            }
            case 'enhance': {
                if (!googleAI) return res.status(200).send(req.body.userInput);
                const { userInput } = req.body;
                const prompt = `
You are an expert Prompt Engineer. Your goal is to rewrite the following user input into a highly effective prompt for an LLM (Large Language Model).
USER INPUT: "${userInput}"
... (Guidelines omitted for brevity) ...
IMPROVED PROMPT:`;
                res.setHeader('Content-Type', 'text/plain');
                try {
                    const stream = await generateContentStreamWithRetry(googleAI, { model: 'gemini-2.5-flash', contents: prompt });
                    for await (const chunk of stream) {
                        const text = chunk.text || '';
                        if (text) res.write(text);
                    }
                } catch (e) { res.write(userInput); }
                res.end();
                break;
            }
            case 'memory_suggest': {
                if (!googleAI) return res.status(200).json({ suggestions: [] });
                const { conversation } = req.body;
                try {
                    const suggestions = await executeExtractMemorySuggestions(googleAI, conversation);
                    res.status(200).json({ suggestions });
                } catch (e) { res.status(200).json({ suggestions: [] }); }
                break;
            }
            case 'memory_consolidate': {
                if (!googleAI) return res.status(200).json({ memory: [req.body.currentMemory, ...req.body.suggestions].filter(Boolean).join('\n') });
                const { currentMemory, suggestions } = req.body;
                try {
                    const memory = await executeConsolidateMemory(googleAI, currentMemory, suggestions);
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
                const { toolName, toolArgs, chatId } = req.body;
                
                // Initialize executor with current context
                const toolExecutor = createToolExecutor({
                    provider: activeProvider,
                    googleAI: googleAI as any,
                    apiKey: activeApiKey!,
                    imageModel: '',
                    videoModel: '',
                    chatId,
                    requestFrontendExecution: async () => ({error: 'Frontend execution not supported'}),
                    skipFrontendCheck: true
                });
                
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
