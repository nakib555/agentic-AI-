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

export const fetchFromApi = (url: string, options: RequestInit = {}): Promise<Response> => {
    // The API key is no longer sent from the client. The backend retrieves it from its own settings store.
    return fetch(`${API_BASE_URL}${url}`, options);
};