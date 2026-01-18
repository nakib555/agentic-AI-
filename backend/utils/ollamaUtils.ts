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
    const config: any = { host };
    if (apiKey) {
        config.headers = { Authorization: `Bearer ${apiKey}` };
    }
    const ollama = new Ollama(config);

    try {
        const response = await ollama.chat({
            model: model,
            messages: messages,
            stream: true,
            options: {
                temperature: settings.temperature,
            }
        });

        let inThinking = false;
        let fullContent = '';
        let hasThinkingBlock = false;

        for await (const part of response) {
            // Handle Thinking (e.g. from DeepSeek R1)
            // Note: The Ollama JS library types might not explicitly include `thinking` yet on Message,
            // but the API returns it for compatible models. We cast to any to access it safely.
            const partMsg = part.message as any;
            
            if (partMsg.thinking) {
                if (!inThinking) {
                    inThinking = true;
                    hasThinkingBlock = true;
                    // Format as a Thought Step for the UI parser
                    const marker = '[STEP] Thinking:\n';
                    callbacks.onTextChunk(marker);
                    fullContent += marker;
                }
                const chunk = partMsg.thinking;
                callbacks.onTextChunk(chunk);
                fullContent += chunk;
            } 
            else if (partMsg.content) {
                if (inThinking) {
                    inThinking = false;
                    // Close the thought block and start Final Answer
                    // The UI parser looks for [STEP] Final Answer: to split thinking from content
                    const marker = '\n\n[STEP] Final Answer:\n';
                    callbacks.onTextChunk(marker);
                    fullContent += marker;
                } else if (hasThinkingBlock && !fullContent.includes('[STEP] Final Answer:')) {
                     // Edge case: thinking ended in previous chunk but we didn't emit the marker yet? 
                     // Unlikely with the logic above, but good for safety.
                     // Actually, we handle the transition on the *first* content chunk after thinking.
                }
                
                const chunk = partMsg.content;
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