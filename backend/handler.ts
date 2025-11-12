/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Import express as a namespace to avoid type conflicts with global DOM types.
import type express from 'express';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { systemInstruction as agenticSystemInstruction } from "./prompts/system.js";
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona.js';
import { parseApiError } from './utils/apiError.js';
import { executeTextToSpeech } from "./tools/tts.js";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory.js";
import { runAgenticLoop } from './services/agenticLoop/index.js';
import { getText } from "./utils/geminiUtils.js";
import { createToolExecutor } from "./tools/index.js";
import { ToolCallEvent } from './services/agenticLoop/types.js';

// State for handling pending frontend tool calls
const pendingFrontendTools = new Map<string, (result: string | { error: string }) => void>();

async function handleChat(res: express.Response, ai: GoogleGenAI, apiKey: string, payload: any, signal: AbortSignal): Promise<void> {
    const { model, history, settings } = payload;
    const { isAgentMode, memoryContent, systemPrompt } = settings;
    console.log('[BACKEND] handleChat started.', { model, isAgentMode });

    res.setHeader('Content-Type', 'application/x-ndjson');
    
    const enqueue = (data: any) => {
      if (data.type !== 'ping') {
        console.log('[BACKEND] Streaming event to frontend:', data);
      }
      if (!res.writableEnded) {
        res.write(JSON.stringify(data) + '\n');
      }
    };
    
    // Heartbeat to keep the connection alive on some hosting platforms
    const heartbeat = setInterval(() => {
        enqueue({ type: 'ping' });
    }, 15000); // Every 15 seconds
    
    const toolExecutor = createToolExecutor(ai, settings.imageModel, settings.videoModel, apiKey, (callId, toolName, toolArgs) => {
        console.log(`[BACKEND] Requesting frontend to execute tool: ${toolName}`, { callId, toolArgs });
        return new Promise((resolve) => {
            pendingFrontendTools.set(callId, resolve);
            enqueue({ type: 'frontend-tool-request', payload: { callId, toolName, toolArgs } });
        });
    });

    const callbacks = {
        onTextChunk: (text: string) => {
            console.log('[BACKEND_CALLBACK] onTextChunk fired.');
            enqueue({ type: 'text-chunk', payload: text });
        },
        onNewToolCalls: (toolCallEvents: ToolCallEvent[]) => {
            console.log('[BACKEND_CALLBACK] onNewToolCalls fired.', { toolCallEvents });
            enqueue({ type: 'tool-call-start', payload: toolCallEvents });
        },
        onToolResult: (id: string, result: string) => {
            console.log('[BACKEND_CALLBACK] onToolResult fired.', { id });
            enqueue({ type: 'tool-call-end', payload: { id, result } });
        },
        onPlanReady: (plan: any) => {
            console.log('[BACKEND_CALLBACK] onPlanReady fired.');
            return new Promise<boolean | string>((resolve) => {
                pendingFrontendTools.set('plan-approval', (approved) => resolve(approved as boolean | string));
                enqueue({ type: 'plan-ready', payload: plan });
            });
        },
        onComplete: (finalText: string, groundingMetadata: any) => {
            console.log('[BACKEND_CALLBACK] onComplete fired.');
            enqueue({ type: 'complete', payload: { finalText, groundingMetadata } });
        },
        onCancel: () => {
            console.log('[BACKEND_CALLBACK] onCancel fired.');
            enqueue({ type: 'cancel' });
        },
        onError: (error: any) => {
            console.error('[BACKEND_CALLBACK] onError fired.', { error });
            enqueue({ type: 'error', payload: error });
        },
    };

    signal.addEventListener('abort', () => {
        console.log('[BACKEND] Request aborted by client.');
        callbacks.onCancel();
        if (!res.writableEnded) {
          res.end();
        }
    });
    
    let finalSystemInstruction = isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
    if (memoryContent) {
        finalSystemInstruction = `// SECTION 0: CONVERSATION MEMORY\n// Here is a summary of key information from past conversations.\n${memoryContent}\n\n${finalSystemInstruction}`;
    }

    try {
        console.log('[BACKEND] Starting agentic loop.');
        await runAgenticLoop({
            ai, model, history, toolExecutor, callbacks,
            settings: {
                ...settings,
                systemInstruction: systemPrompt ? `${systemPrompt}\n\n${finalSystemInstruction}` : finalSystemInstruction,
            },
            signal,
        });
        console.log('[BACKEND] Agentic loop finished.');
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            callbacks.onError(parseApiError(error));
        }
    } finally {
        clearInterval(heartbeat); // Important: stop the heartbeat
        console.log('[BACKEND] Closing chat stream.');
        if (!res.writableEnded) {
          res.end();
        }
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


async function handleTask(ai: GoogleGenAI, task: string, payload: any): Promise<{ status: number, body: any }> {
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
            const conversationTranscript = payload.conversation
                .filter((msg: any) => !msg.isHidden)
                .slice(-6)
                .map((msg: any) => {
                    let text = '';
                    if (msg.role === 'model' && msg.responses && msg.responses[msg.activeResponseIndex]) {
                        text = msg.responses[msg.activeResponseIndex].text || '';
                    } else if (msg.role === 'user') {
                        text = msg.text || '';
                    }
                    return text.substring(0, 300);
                })
                .join('\n');

            const prompt = `Based on the recent conversation, suggest 3 concise and relevant follow-up questions or actions a user might take next. The suggestions should be phrased from the user's perspective (e.g., "Explain this in simpler terms"). Output MUST be a valid JSON array of strings. If no good suggestions can be made, return an empty array [].\n\nCONVERSATION:\n${conversationTranscript}\n\nJSON OUTPUT:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
            return { status: 200, body: { suggestions: JSON.parse(getText(result) || '[]') } };
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

export const apiHandler = async (req: express.Request, res: express.Response) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: { message: "API key is not configured on the backend." } });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const task = req.query.task as string;
    console.log(`[BACKEND] apiHandler received request for task: "${task}"`);
    
    try {
        const payload = req.method === 'POST' ? req.body : {};
        
        if (task === 'chat') {
            const controller = new AbortController();
            req.on('close', () => {
                if (!res.writableEnded) {
                    controller.abort();
                }
            });
            await handleChat(res, ai, apiKey, payload, controller.signal);
            return;
        }

        if (task === 'tool_response') {
            const { status, body } = await handleToolResponse(payload);
            return res.status(status).json(body);
        }
        
        if (task === 'enhance') {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: `You are a prompt engineer. Your task is to rewrite a user's prompt to be more detailed, specific, and effective for a powerful AI model. Retain the user's core intent. If the prompt is already good, you can make minimal changes or return it as-is. Do not add conversational filler.

Original Prompt:
${payload.userInput}

Enhanced Prompt:`,
                config: { temperature: 0.5 }
            });
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            for await (const chunk of stream) {
                res.write(chunk.text);
            }
            res.end();
            return;
        }

        if (task) {
            const { status, body } = await handleTask(ai, task, payload);
            return res.status(status).json(body);
        }
        
        return res.status(400).json({ error: 'No task specified' });

    } catch (error) {
        console.error(`Backend error for task "${task}":`, error);
        const apiError = parseApiError(error);
        return res.status(500).json({ error: apiError });
    }
};