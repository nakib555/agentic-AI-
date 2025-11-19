
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatSession } from '../types';
import { fetchFromApi } from '../utils/api';

export const useMemory = (isMemoryEnabled: boolean) => {
    const [memoryContent, setMemoryContent] = useState<string>('');
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [memorySuggestions, setMemorySuggestions] = useState<string[]>([]);
    const pendingMemoryUpdateRef = useRef<{ suggestions: string[], currentMemory: string } | null>(null);

    useEffect(() => {
        const fetchMemory = async () => {
            if (isMemoryEnabled) {
                try {
                    const response = await fetchFromApi('/api/memory');
                    if (!response.ok) throw new Error('Failed to fetch memory');
                    const data = await response.json();
                    setMemoryContent(data.content || '');
                } catch (error) {
                    console.error("Failed to fetch memory:", error);
                }
            } else {
                setMemoryContent('');
            }
        };
        fetchMemory();
    }, [isMemoryEnabled]);

    const updateBackendMemory = useCallback(async (newContent: string) => {
        try {
            await fetchFromApi('/api/memory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent }),
            });
            setMemoryContent(newContent);
        } catch (error) {
            console.error("Failed to update memory on backend:", error);
            throw error; // Re-throw to allow UI to handle error state
        }
    }, []);

    const updateMemory = useCallback(async (completedChat: ChatSession) => {
        if (!isMemoryEnabled || !completedChat.messages || completedChat.messages.length < 2) return;
        try {
            const response = await fetchFromApi('/api/handler?task=memory_suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation: completedChat.messages }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const { suggestions } = await response.json();
            
            if (suggestions && suggestions.length > 0) {
                pendingMemoryUpdateRef.current = { suggestions, currentMemory: memoryContent };
                setMemorySuggestions(suggestions);
                setIsConfirmationOpen(true);
            }
        } catch (error) {
            console.error("Failed to extract memory suggestions:", error);
        }
    }, [isMemoryEnabled, memoryContent]);

    const confirmMemoryUpdate = useCallback(async () => {
        if (!pendingMemoryUpdateRef.current) return;
        const { suggestions, currentMemory } = pendingMemoryUpdateRef.current;
        try {
            const response = await fetchFromApi('/api/handler?task=memory_consolidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentMemory, suggestions }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const { memory } = await response.json();
            await updateBackendMemory(memory);
        } catch (error) {
            console.error("Failed to consolidate memory:", error);
        } finally {
            setIsConfirmationOpen(false);
            setMemorySuggestions([]);
            pendingMemoryUpdateRef.current = null;
        }
    }, [updateBackendMemory]);
    
    const cancelMemoryUpdate = useCallback(() => {
        setIsConfirmationOpen(false);
        setMemorySuggestions([]);
        pendingMemoryUpdateRef.current = null;
    }, []);

    const clearMemory = useCallback(async () => {
        try {
            await fetchFromApi('/api/memory', { method: 'DELETE' });
            setMemoryContent('');
        } catch (error) {
            console.error("Failed to clear memory on backend:", error);
        }
    }, []);

    return {
        isMemoryEnabled,
        memoryContent,
        updateMemory,
        updateBackendMemory, // Exposed for manual editing
        clearMemory,
        isConfirmationOpen,
        memorySuggestions,
        confirmMemoryUpdate,
        cancelMemoryUpdate,
    };
};
