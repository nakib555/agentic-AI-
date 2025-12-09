
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Detect Node.js environment
// Use type assertion to avoid TypeScript errors when 'process' types are not fully compatible in all environments
export const isNode = typeof process !== 'undefined' && !!(process as any).versions && !!(process as any).versions.node;

// Safely import 'fs/promises' only if in Node.js
// This prevents bundlers (like Wrangler) from failing when targeting Edge/Workers
export const getFs = async () => {
    if (isNode) {
        try {
            return await import('fs/promises');
        } catch (e) {
            return null;
        }
    }
    return null;
};

// Safely import 'fs' (sync)
export const getFsSync = async () => {
    if (isNode) {
        try {
            return await import('fs');
        } catch (e) {
            return null;
        }
    }
    return null;
};
