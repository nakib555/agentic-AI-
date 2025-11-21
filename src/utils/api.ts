
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const getApiBaseUrl = () => {
    // In development, the frontend is served by esbuild's dev server (e.g., on port 8000)
    // and the backend is on port 3001. We need to make absolute requests to the backend.
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3001';
    }
    // In production, both frontend and backend are served from the same origin,
    // so we can use relative paths.
    return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Global callback for version mismatch
let onVersionMismatch = () => {};
export const setOnVersionMismatch = (callback: () => void) => {
    onVersionMismatch = callback;
};

export const fetchFromApi = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const fullUrl = `${API_BASE_URL}${url}`;
    const method = options.method || 'GET';
    
    console.log(`[API Request] 🚀 ${method} ${url}`, {
        fullUrl,
        options: {
            ...options,
            // Don't log the full body if it's huge (like images), just a summary if possible or raw
            body: options.body ? (String(options.body).length > 1000 ? '(Payload too large)' : options.body) : undefined
        }
    });

    const headers = {
        ...options.headers,
        'X-Client-Version': process.env.APP_VERSION || 'unknown',
    };
    
    try {
        const response = await fetch(fullUrl, { ...options, headers });
        
        if (response.status === 409) {
            console.warn(`[API Warning] ⚠️ Version mismatch detected for ${url}`);
            onVersionMismatch();
            // Throw an error to stop the current operation and prevent further processing.
            // The component logic should not need to handle this explicitly; the global overlay will take over.
            throw new Error('Version mismatch');
        }

        if (!response.ok) {
             // Clone the response to read the body for logging without consuming the stream for the caller
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
        } else {
             console.log(`[API Success] ✅ ${method} ${url} (${response.status})`);
        }
        
        return response;
    } catch (error) {
        console.error(`[API Fatal] 💥 ${method} ${url} failed to execute`, {
            cause: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            how: 'Network error, fetch failed, or server unreachable'
        });
        throw error;
    }
};
