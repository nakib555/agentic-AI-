
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from './geminiUtils';

export async function generateProviderCompletion(
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
    
    if (provider === 'openrouter') {
        if (!apiKey) throw new Error("OpenRouter API Key missing");
        const targetModel = model || 'google/gemini-flash-1.5'; // Default fallback
        try {
             const messages = [];
             if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
             messages.push({ role: 'user', content: prompt });
             
             const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://agentic-ai-chat.local",
                    "X-Title": "Agentic AI Chat",
                },
                body: JSON.stringify({
                    model: targetModel,
                    messages: messages,
                    stream: false, // Non-streaming
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });
            if (!resp.ok) return '';
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (e) {
            console.error("OpenRouter completion error:", e);
            return '';
        }
    }

    if (provider === 'ollama') {
        const targetModel = model; 
        if (!targetModel) return ''; 
        
        try {
            const messages = [];
            if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
            messages.push({ role: 'user', content: prompt });
            
            // Default to local if not configured, matching existing handler logic
            const targetEndpoint = 'http://localhost:11434/api/chat'; 

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

             const resp = await fetch(targetEndpoint, {
                 method: 'POST',
                 headers,
                 body: JSON.stringify({
                     model: targetModel,
                     messages,
                     stream: false,
                     format: jsonMode ? "json" : undefined
                 })
             });
             if (!resp.ok) return '';
             const data = await resp.json();
             return data.message?.content || '';
        } catch(e) {
             console.error("Ollama completion error:", e);
             return '';
        }
    }
    return '';
}
