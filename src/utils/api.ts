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
    const headers = {
        ...options.headers,
        'X-Client-Version': process.env.APP_VERSION || 'unknown',
    };
    
    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    
    if (response.status === 409) {
        onVersionMismatch();
        // Throw an error to stop the current operation and prevent further processing.
        // The component logic should not need to handle this explicitly; the global overlay will take over.
        throw new Error('Version mismatch');
    }
    
    return response;
};