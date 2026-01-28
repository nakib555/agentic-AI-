/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readData, SETTINGS_FILE_PATH } from '../data-store';

const getEffectiveEndpoint = async (): Promise<string> => {
    let host = '';
    try {
        const settings: any = await readData(SETTINGS_FILE_PATH);
        host = settings.ollamaHost || '';
    } catch (e) {}
    
    if (!host) {
        host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    }

    host = host.trim().replace(/\/$/, '');
    if (host && !host.startsWith('http://') && !host.startsWith('https://')) {
        host = `http://${host}`;
    }
    return host;
};

export const streamOllama = async (
    apiKey: string | undefined,
    model: string,
    messages: any[],
    callbacks: {
        onTextChunk: (text: string) => void;
        onComplete: (fullText: string) => void;
        onError: (error: any) => void;
    },
    settings: {
        temperature: number;
    }
) => {
    const body = JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
            temperature: settings.temperature,
        }
    });

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    try {
        const host = await getEffectiveEndpoint();
        const endpoint = `${host}/api/chat`;
        
        console.log(`[Ollama] Attempting to stream from ${endpoint}...`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API request failed with status ${response.status}: ${errorText}`);
        }

        if (!response.body) throw new Error("No response body from Ollama");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullContent = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (value) {
                buffer += decoder.decode(value, { stream: true });
            }

            const lines = buffer.split("\n");
            const linesToProcess = done ? lines : lines.slice(0, -1);
            buffer = done ? '' : lines[lines.length - 1];

            for (const line of linesToProcess) {
                if (line.trim() === '') continue;
                try {
                    const data = JSON.parse(line);
                    if (data.message && data.message.content) {
                        const contentChunk = data.message.content;
                        callbacks.onTextChunk(contentChunk);
                        fullContent += contentChunk;
                    }
                } catch (e) {
                    console.error("Error parsing Ollama stream chunk", line, e);
                }
            }
            
            if (done) break;
        }
        callbacks.onComplete(fullContent);

    } catch (error) {
        console.error("Ollama stream failed:", error);
        callbacks.onError(error);
    }
};