
import type { Model as AppModel } from '../../src/types';

export interface StreamCallbacks {
    onTextChunk: (text: string) => void;
    onComplete: (fullText: string) => void;
    onError: (error: any) => void;
}

export interface ChatOptions {
    temperature: number;
    maxTokens: number;
    topP?: number;
    systemInstruction?: string;
}

/**
 * The Contract: Any new AI provider must implement this class.
 */
export interface AIProvider {
    /** Unique internal ID (e.g., 'gemini', 'anthropic') */
    id: string;
    
    /** Display name for the UI */
    name: string;

    /**
     * Fetch the list of available models from this provider.
     */
    getModels(apiKey: string): Promise<AppModel[]>;

    /**
     * Stream a chat completion.
     * @param apiKey The API key for this specific provider
     * @param model The model ID selected
     * @param messages The conversation history (internal format)
     * @param options Configuration options
     * @param callbacks Stream lifecycle callbacks
     */
    chatStream(
        apiKey: string,
        model: string,
        messages: any[],
        options: ChatOptions,
        callbacks: StreamCallbacks
    ): Promise<void>;
}
