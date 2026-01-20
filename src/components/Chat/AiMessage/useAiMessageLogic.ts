
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
    const { isThinking } = msg;

    const activeResponse = useMemo((): ModelResponse | null => {
        if (!msg.responses || msg.responses.length === 0) return null;
        return msg.responses[msg.activeResponseIndex] ?? null;
    }, [msg.responses, msg.activeResponseIndex]);

    const { thinkingText, finalAnswerText: rawFinalAnswerText } = useMemo(() => {
        const text = activeResponse?.text || '';
        const error = !!activeResponse?.error;
        return parseMessageText(text, isThinking ?? false, error);
    }, [activeResponse?.text, activeResponse?.error, isThinking]);

    const textForTts = rawFinalAnswerText || '';
    const { playOrStopAudio, audioState, isPlaying, errorMessage } = useTts(textForTts, ttsVoice, ttsModel);

    const searchSources = useMemo((): Source[] => {
        const allSources: Source[] = [];
        
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
    }, [activeResponse?.groundingMetadata]);

    const thinkingIsComplete = !isThinking || !!activeResponse?.error;
    const hasFinalAnswer = rawFinalAnswerText && rawFinalAnswerText.trim() !== '';

    const isInitialWait = !!isThinking && !activeResponse?.text && !activeResponse?.error;
    
    const handleRunCode = useCallback((language: string, code: string) => {
        const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        sendMessage(userPrompt, undefined, { isThinkingModeEnabled: false });
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
        handleRunCode
    };
};
