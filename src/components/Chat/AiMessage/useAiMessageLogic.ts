/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 1 of 2 from src/components/Chat/AiMessage.tsx
// This hook contains the logic for the AiMessage component.

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Source } from '../../../types';
import { parseMessageText } from '../../../utils/messageParser';
import { useTts } from '../../../hooks/useTts';

export const useAiMessageLogic = (
    msg: Message,
    isAutoPlayEnabled: boolean,
    ttsVoice: string,
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void,
    isLoading: boolean
) => {
    const { text, isThinking, error, startTime, endTime, executionState, plan } = msg;
    const [elapsed, setElapsed] = useState(0);

    const { thinkingText, finalAnswerText } = useMemo(
        () => parseMessageText(text, !!isThinking, !!error),
        [text, isThinking, error]
    );

    const { playOrStopAudio, audioState, isPlaying } = useTts(finalAnswerText, ttsVoice);

    const searchSources = useMemo((): Source[] => {
        if (!msg.toolCallEvents || msg.toolCallEvents.length === 0) return [];
        const allSources: Source[] = [];
        const searchEvents = msg.toolCallEvents.filter(e => e.call.name === 'duckduckgoSearch' && e.result);

        for (const event of searchEvents) {
            const sourcesMatch = event.result!.match(/\[SOURCES_PILLS\]([\s\S]*?)\[\/SOURCES_PILLS\]/s);
            if (sourcesMatch && sourcesMatch[1]) {
                const markdown = sourcesMatch[1].trim();
                const regex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
                let match;
                while ((match = regex.exec(markdown)) !== null) {
                    allSources.push({ title: match[1].trim(), uri: match[2].trim() });
                }
            }
        }
        return Array.from(new Map(allSources.map(s => [s.uri, s])).values());
    }, [msg.toolCallEvents]);

    const thinkingIsComplete = !isThinking || !!error;
    const hasThinkingProcess = thinkingText && thinkingText.trim() !== '';
    const hasFinalAnswer = finalAnswerText && finalAnswerText.trim() !== '';
    const duration = startTime && endTime ? (endTime - startTime) / 1000 : null;
    const autoPlayTriggered = useRef(false);

    useEffect(() => {
        if (isThinking && startTime) {
            const intervalId = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 100);
            return () => clearInterval(intervalId);
        }
    }, [isThinking, startTime]);

    const displayDuration = thinkingIsComplete && duration !== null ? duration.toFixed(1) : elapsed.toFixed(1);

    useEffect(() => {
        if (isAutoPlayEnabled && !autoPlayTriggered.current && thinkingIsComplete && hasFinalAnswer) {
            autoPlayTriggered.current = true;
            playOrStopAudio();
        }
    }, [isAutoPlayEnabled, thinkingIsComplete, hasFinalAnswer, playOrStopAudio]);

    const isInitialWait = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !error && executionState !== 'pending_approval';
    const isStreamingFinalAnswer = !!isThinking && hasFinalAnswer && !error;
    const isWaitingForFinalAnswer = !!isThinking && hasThinkingProcess && !hasFinalAnswer && !error && executionState !== 'pending_approval';
    const showApprovalUI = executionState === 'pending_approval' && plan;

    const handleRunCode = useCallback((language: string, code: string) => {
        const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        sendMessage(userPrompt, undefined, { isThinkingModeEnabled: true });
    }, [sendMessage]);

    return {
        thinkingText, finalAnswerText, playOrStopAudio, audioState, isPlaying, searchSources,
        thinkingIsComplete, hasThinkingProcess, hasFinalAnswer, displayDuration, isInitialWait,
        isStreamingFinalAnswer, isWaitingForFinalAnswer, showApprovalUI, handleRunCode,
    };
};
