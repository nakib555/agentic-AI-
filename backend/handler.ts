/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fix: Import `FunctionCall` type to correctly type the `onNewToolCalls` callback argument.
import { GoogleGenAI, GenerateContentResponse, FunctionCall } from "@google/genai";
import { systemInstruction as agenticSystemInstruction } from "./prompts/system";
import { PREAMBLE } from './prompts/preamble';
import { CHAT_PERSONA_AND_UI_FORMATTING } from './prompts/chatPersona';
import { parseApiError } from './utils/apiError';
import { executeImageGenerator } from './tools/imageGenerator';
import { executeWebSearch } from './tools/webSearch';
import { executeAnalyzeMapVisually, executeAnalyzeImageVisually } from './tools/visualAnalysis';
import { executeCode } from "./tools/codeExecutor";
import { executeVideoGenerator } from "./tools/videoGenerator";
import { executeTextToSpeech } from "./tools/tts";
import { executeExtractMemorySuggestions, executeConsolidateMemory } from "./tools/memory";
import { runAgenticLoop } from './services/agenticLoop';
import { getText } from "./utils/geminiUtils";
import { createToolExecutor } from "./tools";

const chatModeSystemInstruction = [
    PREAMBLE,
    `
# 💬 Conversational Mode Directives
- Your primary goal is to provide a direct, helpful, and conversational response.
- You are in "Chat Mode". For queries that relate to recent events or up-to-date information, you can use the Google Search tool.
- You MUST NOT use agentic workflow formatting (e.g., \`[STEP]\`, \`[AGENT:]\`). Do not think in steps.
- You MUST adhere to all persona and formatting guidelines defined below for conversational responses.
- You MUST NOT mention or allude to the agentic workflow, other tools, agents, "HATF", or a "task force." Your identity is that of a helpful AI assistant.
- Your response should be a single, direct answer, formatted for the user as per the persona guide.
- If you use the search tool, the UI will automatically display the source links. You do not need to list them, but you should synthesize the information from the search into your answer.
    `,
    CHAT_PERSONA_AND_UI_FORMATTING,
].join('\n\n');

// State for handling pending frontend tool calls
const pendingFrontendTools = new Map<string, (result: string | { error: string }) => void>();

async function handleChat(ai: GoogleGenAI, payload: any, signal: AbortSignal): Promise<Response> {
    const { model, history, settings } = payload;
    const { isAgentMode, memoryContent, systemPrompt } = settings;

    const responseStream = new ReadableStream({
        async start(controller) {
            const enqueue = (data: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + '\n'));
            
            const toolExecutor = createToolExecutor(ai, settings.imageModel, settings.videoModel, (callId, toolName, toolArgs) => {
                return new Promise((resolve) => {
                    pendingFrontendTools.set(callId, resolve);
                    enqueue({ type: 'frontend-tool-request', payload: { callId, toolName, toolArgs } });
                });
            });

            const callbacks = {
                onTextChunk: (text: string) => enqueue({ type: 'text-chunk', payload: text }),
                // Fix: `onNewToolCalls` must return a Promise to match the `AgenticLoopCallbacks` type.
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
                if (!controller.desiredSize) return;
                callbacks.onCancel();
                controller.close();
            });
            
            let finalSystemInstruction = isAgentMode ? agenticSystemInstruction : chatModeSystemInstruction;
            if (memoryContent) {
                finalSystemInstruction = `// SECTION 0: CONVERSATION MEMORY\n// Here is a summary of key information from past conversations.\n${memoryContent}\n\n${finalSystemInstruction}`;
            }

            try {
                await runAgenticLoop({
                    model, history, toolExecutor, callbacks,
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
                controller.close();
            }
        }
    });

    return new Response(responseStream, { headers: { 'Content-Type': 'application/x-ndjson' } });
}

async function handleToolResponse(payload: any): Promise<Response> {
    const { callId, result, error } = payload;
    if (pendingFrontendTools.has(callId)) {
        const resolve = pendingFrontendTools.get(callId)!;
        resolve(error ? { error } : result);
        pendingFrontendTools.delete(callId);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: false, error: 'Unknown callId' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}


async function handleTask(ai: GoogleGenAI, task: string, payload: any): Promise<Response> {
    let result: GenerateContentResponse;
    
    switch (task) {
        case 'title': {
            const conversationHistory = payload.messages.map((msg: any) => `${msg.role}: ${(msg.text || '').substring(0, 500)}`).join('\n');
            const prompt = `Based on the following conversation, suggest a short and concise title (5 words maximum). Do not use quotes in the title.\n\nCONVERSATION:\n${conversationHistory}\n\nTITLE:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const title = getText(result).trim().replace(/["']/g, '');
            return new Response(JSON.stringify({ title: title || 'Untitled Chat' }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        case 'suggestions': {
            const conversationTranscript = payload.conversation.filter((msg: any) => !msg.isHidden).slice(-6).map((msg: any) => `${msg.role}: ${(msg.responses?.[msg.activeResponseIndex]?.text || msg.text || '').substring(0, 300)}`).join('\n');
            const prompt = `Based on the recent conversation, suggest 3 concise and relevant follow-up questions or actions a user might take next. The suggestions should be phrased from the user's perspective (e.g., "Explain this in simpler terms"). Output MUST be a valid JSON array of strings. If no good suggestions can be made, return an empty array [].\n\nCONVERSATION:\n${conversationTranscript}\n\nJSON OUTPUT:`;
            result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
            return new Response(JSON.stringify({ suggestions: JSON.parse(getText(result) || '[]') }), { headers: { 'Content-Type': 'application/json' } });
        }

        case 'tts': {
            const { text, voice } = payload;
            const base64Audio = await executeTextToSpeech(ai, text, voice);
            return new Response(JSON.stringify({ audio: base64Audio }), { headers: { 'Content-Type': 'application/json' } });
        }

        case 'memory_suggest': {
            const suggestions = await executeExtractMemorySuggestions(ai, payload.conversation);
            return new Response(JSON.stringify({ suggestions }), { headers: { 'Content-Type': 'application/json' } });
        }

        case 'memory_consolidate': {
            const { currentMemory, suggestions } = payload;
            const newMemory = await executeConsolidateMemory(ai, currentMemory, suggestions);
            return new Response(JSON.stringify({ memory: newMemory }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        default:
            return new Response(JSON.stringify({ error: 'Unknown task' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}

export default {
    async fetch(request: Request, env?: any): Promise<Response> {
        if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
        const apiKey = (env && env.API_KEY) ? env.API_KEY : process.env.API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: { message: "API key is not configured on the backend." } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        
        const ai = new GoogleGenAI({ apiKey });
        const url = new URL(request.url);
        const task = url.searchParams.get('task');
        
        try {
            const payload = await request.json();
            
            if (task === 'chat') return await handleChat(ai, payload, request.signal);
            if (task === 'tool_response') return await handleToolResponse(payload);
            
            if (task === 'enhance') {
                const stream = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: `You are a prompt engineer... Enhanced Prompt:`, // Abridged for brevity
                    config: { temperature: 0.5 }
                });
                
                const responseStream = new ReadableStream({
                    async start(controller) {
                        for await (const chunk of stream) { controller.enqueue(new TextEncoder().encode(chunk.text)); }
                        controller.close();
                    }
                });
                return new Response(responseStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
            }

            if (task) return await handleTask(ai, task, payload);
            return new Response(JSON.stringify({ error: 'No task specified' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
            console.error(`Backend error for task "${task}":`, error);
            const apiError = parseApiError(error);
            return new Response(JSON.stringify({ error: apiError }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
};