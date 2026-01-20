
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { providerRegistry } from '../providers/registry';

export async function generateProviderCompletion(
    providerId: string, 
    apiKey: string | undefined, 
    model: string, 
    prompt: string, 
    systemInstruction?: string,
    jsonMode: boolean = false
): Promise<string> {
    try {
        const provider = await providerRegistry.getProvider(providerId);
        
        return await provider.complete({
            model: model || '',
            prompt,
            systemInstruction,
            apiKey,
            jsonMode
        });
    } catch (error) {
        console.error(`[ProviderCompletion] Error with provider ${providerId}:`, error);
        return '';
    }
}
