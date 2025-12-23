/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const getApiBaseUrl = () => {
    // 1. Check for explicit environment variable (Set this in Cloudflare Pages)
    // Cast import.meta to any to avoid TypeScript errors if types aren't configured
    const meta = import.meta as any;
    if (meta.env && meta.env.VITE_API_BASE_URL) {
        return meta.env.VITE_API_BASE_URL;
    }

    // 2. Development fallback
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3001';
    }

    // 3. Fallback to empty string (relative path) if hosted on same domain
    return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Global callback for version mismatch
let onVersionMismatch = () => {};
export const setOnVersionMismatch = (callback: () => void) => {
    onVersionMismatch = callback;
};

type ApiOptions = RequestInit & { silent?: boolean };

export const fetchFromApi = async (url: string, options: ApiOptions = {}): Promise<Response> => {
    const fullUrl = `${API_BASE_URL}${url}`;
    const method = options.method || 'GET';
    const { silent, ...fetchOptions } = options;
    
    // Cast import.meta to any to avoid TypeScript errors
    const meta = import.meta as any;
    
    const headers = {
        ...fetchOptions.headers,
        'X-Client-Version': (meta.env && meta.env.VITE_APP_VERSION) || 'unknown',
    };
    
    try {
        const response = await fetch(fullUrl, { ...fetchOptions, headers });
        
        if (response.status === 409) {
            console.warn(`[API Warning] ⚠️ Version mismatch detected for ${url}`);
            onVersionMismatch();
            throw new Error('Version mismatch');
        }

        if (!response.ok && !silent) {
             let errorDetails = 'Unknown error';
             try {
                 errorDetails = await response.clone().text();
             } catch (e) {
                 errorDetails = 'Could not read response body';
             }

             console.error(`[API Error] ❌ ${method} ${url} failed`, {
                 status: response.status,
                 statusText: response.statusText,
                 cause: errorDetails,
                 how: 'Server responded with non-2xx status code'
             });
        }
        
        return response;
    } catch (error) {
        if (!silent) {
            console.error(`[API Fatal] 💥 ${method} ${url} failed to execute`, {
                cause: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                how: 'Network error, fetch failed, or server unreachable'
            });
        }
        throw error;
    }
};