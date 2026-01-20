/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AIProvider } from './types';
import GeminiProvider from './gemini';
import OpenRouterProvider from './openrouter';
import OllamaProvider from './ollama';

class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();

    constructor() {
        this.register(GeminiProvider);
        this.register(OpenRouterProvider);
        this.register(OllamaProvider);
    }

    private register(provider: AIProvider) {
        if (provider && provider.id) {
            console.log(`[ProviderRegistry] Registered provider: ${provider.name} (${provider.id})`);
            this.providers.set(provider.id, provider);
        }
    }

    public async getProvider(id: string): Promise<AIProvider> {
        const provider = this.providers.get(id);
        if (!provider) {
            // Fallback to gemini if not found, or throw
            const fallback = this.providers.get('gemini');
            if (fallback) return fallback;
            throw new Error(`Provider '${id}' not found and no fallback available.`);
        }
        return provider;
    }

    public async getAllProviders(): Promise<AIProvider[]> {
        return Array.from(this.providers.values());
    }
}

export const providerRegistry = new ProviderRegistry();