/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Changed type-only import to regular import to resolve type errors.
import { Request, Response } from 'express';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { systemInstruction as agenticSystemInstruction } from "./prompts/system.js";
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona.js';
import { parseApiError, ToolError } from './utils/apiError.js';
import { executeTextToSpeech } from "./tools/tts.js";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory.js";
import { runAgenticLoop } from './services/agenticLoop/index.js';
import { getText } from "./utils/geminiUtils.js";
import { createToolExecutor } from "./tools/index.js";
import { ToolCallEvent } from './services/agenticLoop/types.js';
import { toolDeclarations } from './tools/declarations.js';
import { getApiKey } from './settingsHandler.js';

// --- State for handling asynchronous frontend interactions ---
const activeRequests = new Map<string, AbortController>();
const pendingFrontendTools = new Map<string, (result: string | { error: string }) => void>();

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

async function handleChat(res: Response, ai: GoogleGenAI, apiKey: string, payload: any, requestId: string, signal: AbortSignal): Promise<void> {
    const { chatId, model, history, settings } = payload;
    const { isAgentMode, memoryContent, systemPrompt } = settings;
    console.log('[BACKEND] handleChat started.', { chatId, model, isAgentMode, requestId });

    res.setHeader('Content-Type', 'application/x-ndjson');
    
    const enqueue = (data: any) => {
      if (data.type !== 'ping') {
        console.log('[BACKEND] Streaming event to frontend:', data);
      }
      if (!res.writableEnded) {
        res.write(JSON.stringify(data) + '\n');
      }
    };
    
    enqueue({ type: 'start', payload: { requestId } });

    const heartbeat = setInterval(() => {
        enqueue({ type: 'ping' });
    }, 4000);
    
    const toolExecutor = createToolExecutor(ai, settings.imageModel, settings.videoModel, apiKey, chatId, (callId, toolName, toolArgs) => {
        console.log(`[BACKEND] Requesting frontend to execute tool: ${toolName}`, { callId, toolArgs });
        return new Promise((resolve, reject) => { // Make it rejectable
            const timeout = 30000; // 30 seconds
            const timer = setTimeout(() => {
                pendingFrontendTools.delete(callId);
                reject(new ToolError(toolName, 'FRONTEND_TIMEOUT', `Frontend execution timed out after ${timeout / 1000} seconds.`));
            }, timeout);
    
            const onAbort = () => {
                clearTimeout(timer);
                pendingFrontendTools.delete(callId);
                const abortError = new Error('Request aborted by client');
                abortError.name = 'AbortError';
                reject(abortError);
            };
    
            signal.addEventListener('abort', onAbort, { once: true });
    
            pendingFrontendTools.set(callId, (result) => {
                clearTimeout(timer);
                signal.removeEventListener('abort', onAbort);
                resolve(result);
            });
    
            enqueue({ type: 'frontend-tool-request', payload: { callId, toolName, toolArgs } });
        });
    });

    const callbacks = {
        onTextChunk: (text: string) => enqueue({ type: 'text-chunk', payload: text }),
        onNewToolCalls: (toolCallEvents: ToolCallEvent[]) => enqueue({ type: 'tool-call-start', payload: toolCallEvents }),
        onToolResult: (id: string, result: string) => enqueue({ type: 'tool-call-end', payload: { id, result } }),
        onPlanReady: (plan: any) => {
            return new Promise<boolean | string>((resolve) => {
                pendingFrontendTools.set('plan-approval', (approved) => resolve(approved as boolean | string));
                enqueue({ type: 'plan-ready', payload: plan });
            });
        },
        onComplete: (finalText: string, groundingMetadata: any) => enqueue({ type: 'complete', payload: { finalText, groundingMetadata } }),
        onCancel: () => enqueue({ type: 'cancel' }),
        onError: (error: any) => enqueue({ type: 'error', payload: error }),
    };

    signal.addEventListener('abort', () => {
        console.log('[BACKEND] Request aborted by client.', { requestId });
        callbacks.onCancel();
        if (!res.writableEnded) res.end();
    });
    
    let finalSystemInstruction = isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
    if (memoryContent) {
        finalSystemInstruction = `// SECTION 0: CONVERSATION MEMORY\n// Here is a summary of key information from past conversations.\n${memoryContent}\n\n${finalSystemInstruction}`;
    }

    const finalTools = isAgentMode ? [{ functionDeclarations: toolDeclarations }] : [{ googleSearch: {} }];

    try {
        await runAgenticLoop({
            ai, model, history, toolExecutor, callbacks,
            settings: { ...settings, systemInstruction: systemPrompt ? `${systemPrompt}\n\n${finalSystemInstruction}` : finalSystemInstruction, tools: finalTools },
            signal,
        });
    } catch (error) {
        if ((error as Error).name !== 'AbortError') callbacks.onError(parseApiError(error));
    } finally {
        clearInterval(heartbeat);
        activeRequests.delete(requestId);
        console.log('[BACKEND] Closing chat stream.', { requestId });
        if (!res.writableEnded) res.end();
    }
}

async function handleToolResponse(payload: any): Promise<{ status: number, body: any }> {
    const { callId, result, error } = payload;
    console.log(`[BACKEND] Received tool response from frontend for callId: ${callId}`, { result, error });
    if (pendingFrontendTools.has(callId)) {
        const resolve = pendingFrontendTools.get(callId)!;
        resolve(error ? { error } : result);
        pendingFrontendTools.delete(callId);
        return { status: 200, body: { success: true } };
    }
    return { status: 404, body: { success: false, error: 'Unknown callId' } };
}

async function handleSimpleTask(ai: GoogleGenAI, task: string, payload: any): Promise<{ status: number, body: any }> {
    let result: GenerateContentResponse;
    switch (task) {
        case 'title': {
            const conversationHistory = payload.messages.map((msg: any) => `${msg.role}: ${(msg.text || '').substring(0, 500)}`).join('\n');
            const prompt = `Based on the following conversation, suggest a short and concise title (5 words maximum). Do not use quotes in the title.\n\nCONVERSATION:\n${conversationHistory}\n\nTITLE:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const title = getText(result).trim().replace(/["']/g, '');
            return { status: 200, body: { title: title || 'Untitled Chat' } };
        }
        case 'suggestions': {
            const conversationTranscript = payload.conversation.filter((msg: any) => !msg.isHidden).slice(-6).map((msg: any) => (msg.responses?.[msg.activeResponseIndex]?.text || msg.text || '').substring(0, 300)).join('\n');
            const prompt = `Based on the recent conversation, suggest 3 concise and relevant follow-up questions or actions a user might take next. The suggestions should be phrased from the user's perspective (e.g., "Explain this in simpler terms"). Output MUST be a valid JSON array of strings. If no good suggestions can be made, return an empty array [].\n\nCONVERSATION:\n${conversationTranscript}\n\nJSON OUTPUT:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
            return { status: 200, body: { suggestions: JSON.parse(getText(result) || '[]') } };
        }
        case 'placeholder': {
            const { conversationContext, isAgentMode } = payload;
            const persona = isAgentMode
                ? "You are in 'Agent Mode'. Suggest a creative or complex task the user could perform, like generating an image, analyzing data, or writing code."
                : "You are in 'Chat Mode'. Suggest a relevant follow-up question or a conversational topic related to the last message.";

            const prompt = `Based on the last message in a conversation, suggest a very short, engaging placeholder for a chat input box. It MUST be a single line and between 3 to 7 words. It must not be a long sentence. Do not use quotes.

${persona}

LAST MESSAGE:
"${conversationContext}"

PLACEHOLDER:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const placeholder = getText(result).trim().replace(/["']/g, '');
            return { status: 200, body: { placeholder } };
        }
        case 'tts': {
            const { text, voice } = payload;
            const base64Audio = await executeTextToSpeech(ai, text, voice);
            return { status: 200, body: { audio: base64Audio } };
        }
        case 'memory_suggest': {
            const suggestions = await executeExtractMemorySuggestions(ai, payload.conversation);
            return { status: 200, body: { suggestions } };
        }
        case 'memory_consolidate': {
            const { currentMemory, suggestions } = payload;
            const newMemory = await executeConsolidateMemory(ai, currentMemory, suggestions);
            return { status: 200, body: { memory: newMemory } };
        }
        default:
            return { status: 400, body: { error: 'Unknown task' } };
    }
}

export const apiHandler = async (req: Request, res: Response) => {
    const storedApiKey = await getApiKey();
    const apiKey = storedApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ error: { message: "API key is not configured. Please add it in the app settings or as a server environment variable." } });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const task = req.query.task as string;
    console.log(`[BACKEND] apiHandler received request for task: "${task}"`);
    
    try {
        const payload = req.method === 'POST' ? req.body : {};
        
        if (task === 'chat') {
            const requestId = generateRequestId();
            const controller = new AbortController();
            activeRequests.set(requestId, controller);
            
            req.on('close', () => { // Use 'close' instead of 'aborted' for better reliability
                console.log(`[BACKEND] Request ${requestId} was closed by the client.`);
                if (activeRequests.has(requestId)) {
                    activeRequests.get(requestId)!.abort();
                    activeRequests.delete(requestId);
                }
            });

            await handleChat(res, ai, apiKey, payload, requestId, controller.signal);
            return;
        }

        if (task === 'cancel') {
            const { requestId } = payload;
            if (requestId && activeRequests.has(requestId)) {
                console.log(`[BACKEND] Received explicit cancel for ${requestId}.`);
                activeRequests.get(requestId)!.abort();
                activeRequests.delete(requestId);
                return res.status(200).json({ success: true, message: 'Request cancelled.' });
            }
            return res.status(404).json({ success: false, error: 'Request ID not found or already cancelled.' });
        }

        if (task === 'tool_response') {
            const { status, body } = await handleToolResponse(payload);
            return res.status(status).json(body);
        }
        
        if (task === 'enhance') {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: `You are a prompt engineer. Your task is to rewrite a user's prompt to be more detailed, specific, and effective for a powerful AI model. Retain the user's core intent. If the prompt is already good, you can make minimal changes or return it as-is. Do not add conversational filler.\n\nOriginal Prompt:\n${payload.userInput}\n\nEnhanced Prompt:`,
                config: { temperature: 0.5 }
            });
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            for await (const chunk of stream) res.write(chunk.text);
            res.end();
            return;
        }

        if (task) {
            const { status, body } = await handleSimpleTask(ai, task, payload);
            return res.status(status).json(body);
        }
        
        return res.status(400).json({ error: 'No task specified' });

    } catch (error) {
        console.error(`Backend error for task "${task}":`, error);
        return res.status(500).json({ error: parseApiError(error) });
    }
};