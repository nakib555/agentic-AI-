/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { fetchFromApi } from '../utils/api';

// Time in milliseconds to wait before fetching a new placeholder
const PLACEHOLDER_INTERVAL = 5000;

// Custom-made fallback placeholders for Chat mode
const CHAT_FALLBACK_PLACEHOLDERS = [
  'Ask me anything...',
  'Tell me a fun fact about the Roman Empire',
  'What is the weather like in Tokyo right now?',
  'Explain quantum computing in simple terms',
  'Write a short poem about a rainy day',
];

// Custom-made fallback placeholders for Agent mode
const AGENT_FALLBACK_PLACEHOLDERS = [
  'Generate an image of a majestic lion...',
  'Write a python script to...',
  'Find coffee shops near me and show them on a map',
  'Create a presentation about...',
  'Analyze this data for trends...',
];

/**
 * A custom hook to manage a dynamic, AI-generated placeholder for an input field.
 * It now includes a fallback mechanism to use custom placeholders if the AI fails.
 * @param isEnabled - Whether the placeholder functionality should be active.
 * @param conversationContext - The text of the last message to provide context.
 * @param isAgentMode - Whether the app is in Agent mode, to tailor suggestions.
 * @returns An array of strings for the TextType component [previous, current].
 */
export const usePlaceholder = (isEnabled: boolean, conversationContext: string, isAgentMode: boolean) => {
    const [placeholder, setPlaceholder] = useState<string[]>(['Ask anything, or drop a file']);
    const intervalId = useRef<number | null>(null);

    const setRandomFallback = () => {
        const fallbacks = isAgentMode ? AGENT_FALLBACK_PLACEHOLDERS : CHAT_FALLBACK_PLACEHOLDERS;
        setPlaceholder(prev => {
            const current = prev[prev.length - 1];
            let next = current;
            // Ensure the next random placeholder is different from the current one
            while (next === current && fallbacks.length > 1) {
                next = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            }
            return [current, next];
        });
    };

    const fetchPlaceholder = async () => {
        // If there's no context to provide, just cycle through our custom fallbacks.
        if (!conversationContext) {
            setRandomFallback();
            return;
        }

        try {
            const response = await fetchFromApi('/api/handler?task=placeholder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationContext, isAgentMode }),
            });

            if (!response.ok) {
                throw new Error(`API response not OK: ${response.status}`);
            }

            const { placeholder: newPlaceholder } = await response.json();
            
            if (newPlaceholder && newPlaceholder !== placeholder[placeholder.length - 1]) {
                setPlaceholder(prev => [prev[prev.length - 1], newPlaceholder]);
            } else if (!newPlaceholder) {
                // If the API returns an empty response, use a fallback.
                setRandomFallback();
            }
        } catch (error) {
            console.warn("AI placeholder fetch failed, using fallback:", error);
            setRandomFallback();
        }
    };

    useEffect(() => {
        if (isEnabled) {
            fetchPlaceholder();
            if (intervalId.current) clearInterval(intervalId.current);
            intervalId.current = window.setInterval(fetchPlaceholder, PLACEHOLDER_INTERVAL);
        } else {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
        
        return () => {
            if (intervalId.current) clearInterval(intervalId.current);
        };
    }, [isEnabled, conversationContext, isAgentMode]);

    return placeholder;
};