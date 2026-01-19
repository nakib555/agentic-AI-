

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    
    // As per user request, try the public API first, then fall back to the configured host.
    const endpoints = [
        'https://ollama.com/api/chat',
        `${host.replace(/\/$/, '')}/api/chat`
    ];

    let response: Response | null = null;

    for (const endpoint of [...new Set(endpoints)]) { // Use Set to avoid duplicate requests if host is ollama.com
        try {
            console.log(`[Ollama] Attempting to stream from ${endpoint}...`);
            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body
            });
            if (res.ok) {
                response = res;
                console.log(`[Ollama] Successfully connected to ${endpoint}`);
                break;
            } else {
                console.warn(`[Ollama] Connection to ${endpoint} failed with status ${res.status}.`);
            }
        } catch (error) {
            console.warn(`[Ollama] Connection to ${endpoint} failed with error:`, error);
        }
    }

    if (!response || !response.body) {
        const customError = {
            code: 'OLLAMA_CONNECTION_FAILED',
            message: `Connection to Ollama failed.`,
            details: `Tried both public endpoint and configured host '${host}'. Both were unreachable.`,
            suggestion: `Ensure your local Ollama instance is running or check your internet connection for the public API.`
        };
        callbacks.onError(customError);
        return;
    }

    try {
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
            
            // If stream is done, we process all lines. Otherwise, keep the last, potentially partial line.
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
        console.error("Ollama stream failed during processing:", error);
        callbacks.onError(error);
    }
};