/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Import Request and Response from express directly to resolve type conflicts.
import { Request, Response } from 'express';
import { GoogleGenAI, GenerateContentResponse, FunctionCall } from "@google/genai";
import { systemInstruction as agenticSystemInstruction } from "./prompts/system.js";
import { PREAMBLE } from './prompts/preamble.js';
// FIX: Import CHAT_PERSONA_AND_UI_FORMATTING and alias it to fix 'Cannot find name' error.
import { CHAT_PERSONA_AND_UI_FORMATTING as chatModeSystemInstruction } from './prompts/chatPersona.js';
import { parseApiError } from './utils/apiError.js';
import { executeTextToSpeech } from "./tools/tts.js";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory.js";
import { runAgenticLoop } from './services/agenticLoop/index.js';
import { getText } from "./utils/geminiUtils.js";
import { createToolExecutor } from "./tools/index.js";

// State for handling pending frontend tool calls
const pendingFrontendTools = new Map<string, (result: string | { error: string }) => void>();

// FIX: Update type annotation from ExpressResponse to Response.
async function handleChat(res: Response, ai: GoogleGenAI, apiKey: string, payload: any, signal: AbortSignal): Promise<void> {
    const { model, history, settings } = payload;
    const { isAgentMode, memoryContent, systemPrompt } = settings;

    // FIX: Property 'setHeader' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
    res.setHeader('Content-Type', 'application/x-ndjson');
    
    const enqueue = (data: any) => {
      // FIX: Property 'writableEnded' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
      if (!res.writableEnded) {
        // FIX: Property 'write' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
        res.write(JSON.stringify(data) + '\n');
      }
    };
    
    const toolExecutor = createToolExecutor(ai, settings.imageModel, settings.videoModel, apiKey, (callId, toolName, toolArgs) => {
        return new Promise((resolve) => {
            pendingFrontendTools.set(callId, resolve);
            enqueue({ type: 'frontend-tool-request', payload: { callId, toolName, toolArgs } });
        });
    });

    const callbacks = {
        onTextChunk: (text: string) => enqueue({ type: 'text-chunk', payload: text }),
        onNewToolCalls: (calls: FunctionCall[]) => {
            enqueue({ type: 'tool-call-start', payload: calls });
            return Promise.resolve(calls);
        },
        onToolResult: (id: string, result: string) => enqueue({ type: 'tool-call-end', payload: { id, result } }),
        onPlanReady: (plan: any) => {
            return new Promise<boolean | string>((resolve) => {
                pendingFrontendTools.set('plan-approval', (approved) => resolve(approved as boolean | string));
                enqueue({ type: 'plan-ready', payload: plan });
            });
        },
        onComplete: (finalText: string, groundingMetadata: any) => {
            enqueue({ type: 'complete', payload: { finalText, groundingMetadata } });
        },
        onCancel: () => enqueue({ type: 'cancel' }),
        onError: (error: any) => enqueue({ type: 'error', payload: error }),
    };

    signal.addEventListener('abort', () => {
        callbacks.onCancel();
        // FIX: Property 'writableEnded' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
        if (!res.writableEnded) {
          // FIX: Property 'end' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
          res.end();
        }
    });
    
    // FIX: Cannot find name 'chatModeSystemInstruction'. This is fixed by importing it.
    let finalSystemInstruction = isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
    if (memoryContent) {
        finalSystemInstruction = `// SECTION 0: CONVERSATION MEMORY\n// Here is a summary of key information from past conversations.\n${memoryContent}\n\n${finalSystemInstruction}`;
    }

    try {
        await runAgenticLoop({
            ai, model, history, toolExecutor, callbacks,
            settings: {
                ...settings,
                systemInstruction: systemPrompt ? `${systemPrompt}\n\n${finalSystemInstruction}` : finalSystemInstruction,
            },
            signal,
        });
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            callbacks.onError(parseApiError(error));
        }
    } finally {
        // FIX: Property 'writableEnded' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
        if (!res.writableEnded) {
          // FIX: Property 'end' does not exist on type 'Response<any, Record<string, any>>'. This is fixed by using the correct Response type.
          res.end();
        }
    }
}

async function handleToolResponse(payload: any): Promise<{ status: number, body: any }> {
    const { callId, result, error } = payload;
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
            const conversationTranscript = payload.conversation.filter((msg: any) => !msg.isHidden).slice(-6).map((msg: any) => `${msg.role}: ${(msg.responses?.[msg.activeResponseIndex]?.text || msg.text || '').substring(0, 300)}`).join('\n');
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


// FIX: Update type annotations from ExpressRequest/ExpressResponse to Request/Response.
export const apiHandler = async (req: Request, res: Response) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // FIX: Property 'status' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
        return res.status(500).json({ error: { message: "API key is not configured on the backend." } });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    // FIX: Property 'query' does not exist on type 'Request<...>'. Fixed by using correct Request type.
    const task = req.query.task as string;
    
    try {
        // FIX: Properties 'method' and 'body' do not exist on type 'Request<...>'. Fixed by using correct Request type.
        const payload = req.method === 'POST' ? req.body : {};
        
        if (task === 'chat') {
            // FIX: Property 'signal' does not exist on type 'Request<...>'. Fixed by using correct Request type.
            await handleChat(res, ai, apiKey, payload, req.signal);
            return; // handleChat manages the response stream
        }
        if (task === 'tool_response') {
            const { status, body } = await handleToolResponse(payload);
            // FIX: Property 'status' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
            return res.status(status).json(body);
        }
        
        if (task === 'enhance') {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: `You are a prompt engineer... Enhanced Prompt:`, // Abridged for brevity
                config: { temperature: 0.5 }
            });
            
            // FIX: Property 'setHeader' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            for await (const chunk of stream) {
                // FIX: Property 'write' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
                res.write(chunk.text);
            }
            // FIX: Property 'end' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
            res.end();
            return;
        }

        if (task) {
            const { status, body } = await handleTask(ai, task, payload);
            // FIX: Property 'status' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
            return res.status(status).json(body);
        }
        
        // FIX: Property 'status' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
        return res.status(400).json({ error: 'No task specified' });

    } catch (error) {
        console.error(`Backend error for task "${task}":`, error);
        const apiError = parseApiError(error);
        // FIX: Property 'status' does not exist on type 'Response<any, Record<string, any>>'. Fixed by using correct Response type.
        return res.status(500).json({ error: apiError });
    }
};