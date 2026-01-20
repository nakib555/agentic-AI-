
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AIProvider } from './types';

class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private initialized = false;

    constructor() {
        this.loadProviders();
    }

    private async loadProviders() {
        if (this.initialized) return;

        let providersDir: string;
        try {
            // ESM environment
            if (import.meta && import.meta.url) {
                const currentFile = fileURLToPath(import.meta.url);
                providersDir = path.dirname(currentFile);
            } else {
                throw new Error('CJS');
            }
        } catch {
            // CJS fallback
            // @ts-ignore - __dirname exists in CJS context but TS might be configured for ESM
            providersDir = __dirname;
        }

        const files = fs.readdirSync(providersDir).filter(file => {
            return (file.endsWith('.ts') || file.endsWith('.js')) 
                && !file.endsWith('.d.ts') 
                && file !== 'index.ts' 
                && file !== 'registry.ts'
                && file !== 'types.ts';
        });

        for (const file of files) {
            try {
                // Dynamic import
                const modulePath = path.join(providersDir, file);
                const moduleUrl = `file://${modulePath}`; // Windows compatibility for dynamic import
                
                const module = await import(moduleUrl);
                
                // Expecting a default export that is the provider instance
                const provider = module.default as AIProvider;
                
                if (provider && provider.id && typeof provider.chat === 'function') {
                    console.log(`[ProviderRegistry] Registered provider: ${provider.name} (${provider.id})`);
                    this.providers.set(provider.id, provider);
                }
            } catch (error) {
                console.error(`[ProviderRegistry] Failed to load provider from ${file}:`, error);
            }
        }
        
        this.initialized = true;
    }

    public async getProvider(id: string): Promise<AIProvider> {
        await this.loadProviders();
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
        await this.loadProviders();
        return Array.from(this.providers.values());
    }
}

export const providerRegistry = new ProviderRegistry();
