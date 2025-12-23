
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const getApiBaseUrl = () => {
    // 1. Manual Override from LocalStorage (Highest Priority)
    // This allows users to fix connection issues at runtime via Settings
    if (typeof window !== 'undefined') {
        const customUrl = localStorage.getItem('custom_server_url');
        if (customUrl) return customUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    // 2. Check for explicit environment variable (Set this in Cloudflare Pages/Vercel)
    // We access import.meta.env directly to allow Vite's `define` to replace it statically at build time.
    // @ts-ignore
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
        return envUrl.replace(/\/$/, '');
    }

    // 3. Development fallback
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3001';
    }

    // 4. Fallback to empty string (relative path) if hosted on same domain
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
    const baseUrl = getApiBaseUrl();
    const fullUrl = `${baseUrl}${url}`;
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
                how: 'Network error, fetch failed, or server unreachable',
                endpoint: fullUrl
            });
        }
        throw error;
    }
};