
import { AIProvider } from './types';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import { OllamaProvider } from './ollama';

/**
 * 🏭 PROVIDER REGISTRY
 * 
 * To add a new AI provider (e.g. Anthropic, Mistral):
 * 1. Create a new file in `backend/providers/myprovider.ts` implementing `AIProvider`.
 * 2. Import it here.
 * 3. Add `new MyProvider()` to the `providers` map below.
 * 
 * The rest of the application will automatically detect and use it.
 */

const providers: Record<string, AIProvider> = {
    'gemini': new GeminiProvider(),
    'openrouter': new OpenRouterProvider(),
    'ollama': new OllamaProvider(),
    // 'anthropic': new AnthropicProvider(), // Future extension example
};

export const getProvider = (providerId: string): AIProvider => {
    const provider = providers[providerId];
    if (!provider) {
        console.warn(`Provider '${providerId}' not found, falling back to Gemini.`);
        return providers['gemini'];
    }
    return provider;
};

export const getAvailableProviders = () => {
    return Object.values(providers).map(p => ({ id: p.id, name: p.name }));
};
