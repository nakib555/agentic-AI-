
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const streamOpenRouter = async (
    apiKey: string,
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
        topP?: number;
    }
) => {
    try {
        const cleanKey = apiKey ? apiKey.trim() : "";
        if (!cleanKey) {
            throw new Error("OpenRouter API key is missing or empty. Please check your settings.");
        }

        // OpenRouter expects "user" messages to have "content", and "system" messages to be mapped correctly.
        // We assume 'messages' passed in are already roughly compatible (role, content).
        const apiMessages = messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: typeof m.parts === 'string' ? m.parts : (m.parts?.[0]?.text || m.text || '')
        }));

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${cleanKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://agentic-ai-chat.local", // Provides context to OpenRouter
                "X-Title": "Agentic AI Chat",
            },
            body: JSON.stringify({
                model: model,
                messages: apiMessages,
                stream: true,
                temperature: settings.temperature,
                max_tokens: settings.maxTokens > 0 ? settings.maxTokens : undefined,
                top_p: settings.topP,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let parsedError;
            try {
                parsedError = JSON.parse(errorText);
            } catch (e) {
                parsedError = { error: { message: errorText } };
            }
            
            const message = parsedError.error?.message || errorText;
            const code = parsedError.error?.code || response.status;
            
            throw new Error(`OpenRouter Error (${code}): ${message}`);
        }

        if (!response.body) throw new Error("No response body from OpenRouter");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Split by double newline usually separates SSE events, but standard is \n
            const lines = buffer.split("\n");
            
            // Keep the last line in the buffer as it might be incomplete
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;

                const dataStr = trimmed.replace("data: ", "").trim();
                
                if (dataStr === "[DONE]") continue;

                try {
                    const data = JSON.parse(dataStr);
                    const delta = data.choices?.[0]?.delta?.content;
                    
                    if (delta) {
                        fullText += delta;
                        callbacks.onTextChunk(delta);
                    }
                } catch (e) {
                    console.warn("Error parsing OpenRouter chunk", trimmed);
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
             try {
                const data = JSON.parse(buffer.replace("data: ", "").trim());
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                    fullText += delta;
                    callbacks.onTextChunk(delta);
                }
             } catch (e) {}
        }

        callbacks.onComplete(fullText);

    } catch (error) {
        console.error("OpenRouter stream failed:", error);
        callbacks.onError(error);
    }
};
