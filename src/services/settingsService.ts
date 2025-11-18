/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchFromApi } from '../utils/api';
import type { Model } from '../types';

export type AppSettings = {
    apiKey: string;
    aboutUser: string;
    aboutResponse: string;
    temperature: number;
    maxTokens: number;
    imageModel: string;
    videoModel: string;
    isMemoryEnabled: boolean;
    ttsVoice: string;
    isAutoPlayEnabled: boolean;
    isAgentMode: boolean;
};

export type UpdateSettingsResponse = AppSettings & {
    models?: Model[];
    imageModels?: Model[];
    videoModels?: Model[];
};

export const getSettings = async (): Promise<AppSettings> => {
    const response = await fetchFromApi('/api/settings');
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<UpdateSettingsResponse> => {
    const response = await fetchFromApi('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'An unknown error occurred while saving settings.' }));
        throw new Error(errorBody.error);
    }
    return response.json();
};