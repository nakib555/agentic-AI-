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
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // "HTTP-Referer": "YOUR_SITE_URL", // Optional
                // "X-Title": "YOUR_SITE_NAME", // Optional
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true,
                temperature: settings.temperature,
                max_tokens: settings.maxTokens > 0 ? settings.maxTokens : undefined,
                top_p: settings.topP,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        if (!response.body) throw new Error("No response body from OpenRouter");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim() !== "");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "");
                    if (dataStr === "[DONE]") break;

                    try {
                        const data = JSON.parse(dataStr);
                        const delta = data.choices[0]?.delta?.content;
                        if (delta) {
                            fullText += delta;
                            callbacks.onTextChunk(delta);
                        }
                    } catch (e) {
                        console.error("Error parsing OpenRouter chunk", e);
                    }
                }
            }
        }

        callbacks.onComplete(fullText);

    } catch (error) {
        console.error("OpenRouter stream failed:", error);
        callbacks.onError(error);
    }
};