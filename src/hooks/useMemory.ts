/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Fix module import path for gemini services to point to the barrel file, resolving ambiguity with an empty `gemini.ts` file.
import { consolidateMemory, extractMemorySuggestions } from '../services/gemini/index';
// FIX: Correct relative import path for types.
import type { ChatSession } from '../types';

const MEMORY_ENABLED_KEY = 'agentic-memoryEnabled';
const MEMORY_CONTENT_KEY = 'agentic-memoryContent';

export const useMemory = () => {
    const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem(MEMORY_ENABLED_KEY);
        return saved ? JSON.parse(saved) : false;
    });

    const [memoryContent, setMemoryContent] = useState<string>(() => {
        return localStorage.getItem(MEMORY_CONTENT_KEY) || '';
    });

    // State for the confirmation modal flow
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [memorySuggestions, setMemorySuggestions] = useState<string[]>([]);
    const pendingMemoryUpdateRef = useRef<{ suggestions: string[], currentMemory: string } | null>(null);


    useEffect(() => {
        localStorage.setItem(MEMORY_ENABLED_KEY, JSON.stringify(isMemoryEnabled));
        if (!isMemoryEnabled) {
            // If memory is disabled, clear the content for privacy and to save space.
            localStorage.removeItem(MEMORY_CONTENT_KEY);
            setMemoryContent('');
        }
    }, [isMemoryEnabled]);

    useEffect(() => {
        if (isMemoryEnabled) {
            localStorage.setItem(MEMORY_CONTENT_KEY, memoryContent);
        }
    }, [memoryContent, isMemoryEnabled]);

    const updateMemory = useCallback(async (completedChat: ChatSession) => {
        // Only update memory if the feature is enabled and the chat has at least one user/model exchange.
        if (!isMemoryEnabled || completedChat.messages.length < 2) {
            return;
        }
        try {
            const suggestions = await extractMemorySuggestions(completedChat.messages);
            if (suggestions && suggestions.length > 0) {
                // Store the suggestions and current memory state, then open the confirmation dialog.
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
            const newMemory = await consolidateMemory(currentMemory, suggestions);
            setMemoryContent(newMemory);
        } catch (error) {
            console.error("Failed to consolidate memory:", error);
        } finally {
            // Clean up and close the modal regardless of success or failure.
            setIsConfirmationOpen(false);
            setMemorySuggestions([]);
            pendingMemoryUpdateRef.current = null;
        }
    }, []);
    
    const cancelMemoryUpdate = useCallback(() => {
        // Simply close the modal and clear the pending state.
        setIsConfirmationOpen(false);
        setMemorySuggestions([]);
        pendingMemoryUpdateRef.current = null;
    }, []);

    const clearMemory = useCallback(() => {
        setMemoryContent('');
        localStorage.removeItem(MEMORY_CONTENT_KEY);
    }, []);

    return {
        isMemoryEnabled,
        setIsMemoryEnabled,
        memoryContent,
        updateMemory,
        clearMemory,
        // For confirmation modal
        isConfirmationOpen,
        memorySuggestions,
        confirmMemoryUpdate,
        cancelMemoryUpdate,
    };
};