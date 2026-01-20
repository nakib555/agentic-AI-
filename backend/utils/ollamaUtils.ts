
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
        host?: string;
    }
) => {
    // Map internal message format to Ollama format
    const apiMessages = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: typeof m.parts === 'string' ? m.parts : (m.parts?.[0]?.text || m.text || '')
    }));

    const body = JSON.stringify({
        model,
        messages: apiMessages,
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
    
    // Allow custom host via settings, fallback to localhost
    let endpoint = settings.host || 'http://localhost:11434';
    // Remove trailing slash if present
    endpoint = endpoint.replace(/\/$/, '');
    const url = `${endpoint}/api/chat`;

    let response: Response | null = null;

    try {
        console.log(`[Ollama] Attempting to stream from ${url}...`);
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        
        if (res.ok) {
            response = res;
        } else {
            const errorText = await res.text();
            throw new Error(`Ollama API request failed with status ${res.status}: ${errorText}`);
        }
    } catch (error) {
        console.warn(`[Ollama] Connection to ${url} failed:`, error);
        const customError = {
            code: 'OLLAMA_CONNECTION_FAILED',
            message: `Connection to Ollama failed.`,
            details: `Ensure Ollama is running at ${endpoint} and CORS is allowed. Error: ${(error as Error).message}`,
            suggestion: `Check if 'ollama serve' is running and OLLAMA_ORIGINS="*" is set.`
        };
        callbacks.onError(customError);
        return;
    }

    if (!response || !response.body) {
        callbacks.onError({ message: "Ollama returned an empty response body." });
        return;
    }

    try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullContent = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Ollama sends one JSON object per line
            const lines = buffer.split("\n");
            
            // Keep the last line in the buffer as it might be incomplete
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const data = JSON.parse(line);
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.message && data.message.content) {
                        const contentChunk = data.message.content;
                        callbacks.onTextChunk(contentChunk);
                        fullContent += contentChunk;
                    }
                    
                    if (data.done) {
                        // Stream finished logic can go here if needed
                    }
                } catch (e) {
                    console.warn("Error parsing Ollama stream chunk", line);
                }
            }
        }
        
        // Process residual buffer
        if (buffer.trim()) {
             try {
                const data = JSON.parse(buffer);
                if (data.message && data.message.content) {
                    callbacks.onTextChunk(data.message.content);
                    fullContent += data.message.content;
                }
             } catch(e) {}
        }

        callbacks.onComplete(fullContent);

    } catch (error) {
        console.error("Ollama stream failed during processing:", error);
        callbacks.onError(error);
    }
};
