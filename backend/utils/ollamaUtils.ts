
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const streamOllama = async (
    baseUrl: string,
    model: string,
    messages: any[],
    callbacks: {
        onTextChunk: (text: string) => void;
        onComplete: (fullText: string) => void;
        onError: (error: any) => void;
    },
    settings: {
        temperature: number;
        maxTokens: number;
    }
) => {
    try {
        if (!baseUrl || !baseUrl.trim()) {
            throw new Error("Ollama URL is not configured. Please set it in Settings.");
        }

        let cleanUrl = baseUrl.trim().replace(/\/$/, '');
        
        // Robustness: Ensure protocol is present
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = `http://${cleanUrl}`;
        }
        
        // Robustness: If the user provided a URL ending in /api/tags (common mistake when copying from docs), 
        // we should strip it to find the base, then append /api/chat.
        if (cleanUrl.endsWith('/api/tags')) {
             cleanUrl = cleanUrl.replace(/\/api\/tags$/, '');
        }

        console.log(`[OllamaStream] Connecting to: ${cleanUrl}/api/chat with model: ${model}`);
        
        // Convert messages to Ollama format
        // Ollama uses 'role' and 'content', similar to OpenAI
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const body = {
            model: model,
            messages: formattedMessages,
            stream: true,
            options: {
                temperature: settings.temperature,
                num_predict: settings.maxTokens > 0 ? settings.maxTokens : undefined,
            }
        };

        const response = await fetch(`${cleanUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
        }

        if (!response.body) throw new Error("No response body from Ollama");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep last line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    
                    if (data.done) {
                        break;
                    }

                    if (data.message && data.message.content) {
                        const delta = data.message.content;
                        fullText += delta;
                        callbacks.onTextChunk(delta);
                    }
                } catch (e) {
                    // console.error("Error parsing Ollama chunk", e);
                }
            }
        }

        callbacks.onComplete(fullText);

    } catch (error) {
        console.error("Ollama stream failed:", error);
        callbacks.onError(error);
    }
};

export const streamOllamaGenerate = async (
    baseUrl: string,
    model: string,
    prompt: string,
    callbacks: {
        onTextChunk: (text: string) => void;
        onComplete: (fullText: string) => void;
        onError: (error: any) => void;
    },
    settings: {
        temperature: number;
        maxTokens: number;
    }
) => {
    try {
        if (!baseUrl || !baseUrl.trim()) {
            throw new Error("Ollama URL is not configured. Please set it in Settings.");
        }

        let cleanUrl = baseUrl.trim().replace(/\/$/, '');

        // Robustness: Ensure protocol is present
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = `http://${cleanUrl}`;
        }

        // Robustness: Strip /api/tags if present to get base URL
        if (cleanUrl.endsWith('/api/tags')) {
             cleanUrl = cleanUrl.replace(/\/api\/tags$/, '');
        }

        console.log(`[OllamaGenerate] Connecting to: ${cleanUrl}/api/generate with model: ${model}`);
        
        const body = {
            model: model,
            prompt: prompt,
            stream: true,
            options: {
                temperature: settings.temperature,
                num_predict: settings.maxTokens > 0 ? settings.maxTokens : undefined,
            }
        };

        const response = await fetch(`${cleanUrl}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
        }

        if (!response.body) throw new Error("No response body from Ollama");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    
                    if (data.done) break;

                    if (data.response) {
                        const delta = data.response;
                        fullText += delta;
                        callbacks.onTextChunk(delta);
                    }
                } catch (e) { }
            }
        }

        callbacks.onComplete(fullText);

    } catch (error) {
        console.error("Ollama generate stream failed:", error);
        callbacks.onError(error);
    }
};

export const generateOllama = async (
    baseUrl: string,
    model: string,
    prompt: string,
    options: { temperature?: number, maxTokens?: number, format?: string } = {}
): Promise<string> => {
    if (!baseUrl || !baseUrl.trim()) throw new Error("Ollama URL missing");
    
    let cleanUrl = baseUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
    if (cleanUrl.endsWith('/api/tags')) cleanUrl = cleanUrl.replace(/\/api\/tags$/, '');

    const body: any = {
        model,
        prompt,
        stream: false,
        options: {
            temperature: options.temperature,
            num_predict: options.maxTokens,
        }
    };
    
    if (options.format === 'json') {
        body.format = 'json';
    }

    const response = await fetch(`${cleanUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
};
