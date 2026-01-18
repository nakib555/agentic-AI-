
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ollama } from 'ollama';

export const streamOllama = async (
    host: string,
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
    // Configure Ollama with host and optional API key in headers
    const config: any = { host };
    
    if (apiKey) {
        config.headers = { 
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey // Support alternative header convention if needed by proxies
        };
    }
    
    const ollama = new Ollama(config);

    try {
        console.log(`[Ollama] Chatting with model ${model} at ${host}...`);
        const response = await ollama.chat({
            model: model,
            messages: messages,
            stream: true,
            options: {
                temperature: settings.temperature,
            }
        });

        let fullContent = '';
        for await (const part of response) {
            if (part.message.content) {
                const chunk = part.message.content;
                callbacks.onTextChunk(chunk);
                fullContent += chunk;
            }
        }
        
        callbacks.onComplete(fullContent);

    } catch (error) {
        console.error("Ollama stream failed:", error);
        callbacks.onError(error);
    }
};
