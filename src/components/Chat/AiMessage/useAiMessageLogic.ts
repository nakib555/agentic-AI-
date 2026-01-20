
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback } from 'react';
import type { Message, ModelResponse, Source } from '../../../types';
import { useTts } from '../../../hooks/useTts';
import { parseMessageText } from '../../../utils/messageParser';

export const useAiMessageLogic = (
    msg: Message,
    ttsVoice: string,
    ttsModel: string,
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void,
    isLoading: boolean
) => {
    const { isThinking, executionState } = msg;

    const activeResponse = useMemo((): ModelResponse | null => {
        if (!msg.responses || msg.responses.length === 0) return null;
        return msg.responses[msg.activeResponseIndex] ?? null;
    }, [msg.responses, msg.activeResponseIndex]);

    // Parse the raw text for TTS and Toolbar purposes
    const { thinkingText, finalAnswerText: rawFinalAnswerText } = useMemo(() => {
        const text = activeResponse?.text || '';
        const error = !!activeResponse?.error;
        return parseMessageText(text, isThinking ?? false, error);
    }, [activeResponse?.text, activeResponse?.error, isThinking]);

    const textForTts = rawFinalAnswerText || '';
    const { playOrStopAudio, audioState, isPlaying, errorMessage } = useTts(textForTts, ttsVoice, ttsModel);

    // Extract sources logic remains useful for the toolbar
    const searchSources = useMemo((): Source[] => {
        const allSources: Source[] = [];
        
        if (activeResponse?.toolCallEvents && activeResponse.toolCallEvents.length > 0) {
            const searchEvents = activeResponse.toolCallEvents.filter(e => e.call.name === 'duckduckgoSearch' && e.result);
            for (const event of searchEvents) {
                const sourcesMatch = event.result!.match(/\[SOURCES_PILLS\]([\s\S]*?)\[\/SOURCES_PILLS\]/s);
                if (sourcesMatch && sourcesMatch[1]) {
                    const regex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
                    let match;
                    while ((match = regex.exec(sourcesMatch[1])) !== null) {
                        allSources.push({ title: match[1].trim(), uri: match[2].trim() });
                    }
                }
            }
        }
        
        if (activeResponse?.groundingMetadata?.groundingChunks && Array.isArray(activeResponse.groundingMetadata.groundingChunks)) {
            for (const chunk of activeResponse.groundingMetadata.groundingChunks) {
                if (chunk.web?.uri) {
                    allSources.push({
                        uri: chunk.web.uri,
                        title: chunk.web.title || chunk.web.uri,
                    });
                }
            }
        }

        return Array.from(new Map(allSources.map(s => [s.uri, s])).values());
    }, [activeResponse?.toolCallEvents, activeResponse?.groundingMetadata]);

    const thinkingIsComplete = !isThinking || !!activeResponse?.error;
    const hasFinalAnswer = rawFinalAnswerText && rawFinalAnswerText.trim() !== '';

    // Initial wait is strictly when there is NO content yet.
    const isInitialWait = !!isThinking && !activeResponse?.text && !activeResponse?.error;
    
    // showApprovalUI logic
    const showApprovalUI = executionState === 'pending_approval' && !!activeResponse?.plan;

    const handleRunCode = useCallback((language: string, code: string) => {
        const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        sendMessage(userPrompt, undefined, { isThinkingModeEnabled: true });
    }, [sendMessage]);

    return {
        activeResponse, 
        thinkingText,
        finalAnswerText: rawFinalAnswerText, 
        playOrStopAudio, audioState, isPlaying, ttsError: errorMessage,
        searchSources,
        thinkingIsComplete, hasFinalAnswer,
        startTime: activeResponse?.startTime,
        endTime: activeResponse?.endTime,
        isInitialWait,
        showApprovalUI, handleRunCode
    };
};
