/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatSession } from '../types';
import { API_BASE_URL } from '../../utils/api';

const MEMORY_ENABLED_KEY = 'agentic-memoryEnabled';
const MEMORY_CONTENT_KEY = 'agentic-memoryContent';

export const useMemory = () => {
    const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(() => JSON.parse(localStorage.getItem(MEMORY_ENABLED_KEY) || 'false'));
    const [memoryContent, setMemoryContent] = useState<string>(() => localStorage.getItem(MEMORY_CONTENT_KEY) || '');
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [memorySuggestions, setMemorySuggestions] = useState<string[]>([]);
    const pendingMemoryUpdateRef = useRef<{ suggestions: string[], currentMemory: string } | null>(null);

    useEffect(() => {
        localStorage.setItem(MEMORY_ENABLED_KEY, JSON.stringify(isMemoryEnabled));
        if (!isMemoryEnabled) {
            localStorage.removeItem(MEMORY_CONTENT_KEY);
            setMemoryContent('');
        }
    }, [isMemoryEnabled]);

    useEffect(() => {
        if (isMemoryEnabled) localStorage.setItem(MEMORY_CONTENT_KEY, memoryContent);
    }, [memoryContent, isMemoryEnabled]);

    const updateMemory = useCallback(async (completedChat: ChatSession) => {
        if (!isMemoryEnabled || completedChat.messages.length < 2) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/handler?task=memory_suggest`, {
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
            const response = await fetch(`${API_BASE_URL}/api/handler?task=memory_consolidate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentMemory, suggestions }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const { memory } = await response.json();
            setMemoryContent(memory);
        } catch (error) {
            console.error("Failed to consolidate memory:", error);
        } finally {
            setIsConfirmationOpen(false);
            setMemorySuggestions([]);
            pendingMemoryUpdateRef.current = null;
        }
    }, []);
    
    const cancelMemoryUpdate = useCallback(() => {
        setIsConfirmationOpen(false);
        setMemorySuggestions([]);
        pendingMemoryUpdateRef.current = null;
    }, []);

    const clearMemory = useCallback(() => {
        setMemoryContent('');
        localStorage.removeItem(MEMORY_CONTENT_KEY);
    }, []);

    return {
        isMemoryEnabled, setIsMemoryEnabled, memoryContent, updateMemory, clearMemory,
        isConfirmationOpen, memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate,
    };
};