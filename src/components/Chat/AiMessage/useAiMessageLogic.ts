
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 1 of 2 from src/components/Chat/AiMessage.tsx
// This hook contains the logic for the AiMessage component.

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Message, ModelResponse, Source } from '../../../types';
import { parseMessageText } from '../../../utils/messageParser';
import { useTts } from '../../../hooks/useTts';
import { parseAgenticWorkflow } from '../../../services/workflowParser';

export const useAiMessageLogic = (
    msg: Message,
    isAutoPlayEnabled: boolean,
    ttsVoice: string,
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void,
    isLoading: boolean
) => {
    const { isThinking, executionState } = msg;
    const [elapsed, setElapsed] = useState(0);

    const activeResponse = useMemo((): ModelResponse | null => {
        if (!msg.responses || msg.responses.length === 0) return null;
        return msg.responses[msg.activeResponseIndex] ?? null;
    }, [msg.responses, msg.activeResponseIndex]);

    const { thinkingText, finalAnswerText } = useMemo(
        () => parseMessageText(activeResponse?.text || '', !!isThinking, !!activeResponse?.error),
        [activeResponse, isThinking]
    );

    const { playOrStopAudio, audioState, isPlaying } = useTts(finalAnswerText, ttsVoice);

    const searchSources = useMemo((): Source[] => {
        const allSources: Source[] = [];
        
        // From tool calls (Agent mode)
        if (activeResponse?.toolCallEvents && activeResponse.toolCallEvents.length > 0) {
            const searchEvents = activeResponse.toolCallEvents.filter(e => e.call.name === 'duckduckgoSearch' && e.result);

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
        }
        
        // From groundingMetadata (Chat mode search)
        if (activeResponse?.groundingMetadata?.groundingChunks) {
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
    
    // Parse Agentic Workflow for inline display
    const { plan: agentPlan, executionLog } = useMemo(() => {
        return parseAgenticWorkflow(
            thinkingText,
            activeResponse?.toolCallEvents || [],
            thinkingIsComplete,
            activeResponse?.error
        );
    }, [thinkingText, activeResponse?.toolCallEvents, thinkingIsComplete, activeResponse?.error]);

    // We now consider "having thinking process" true if we have a plan OR execution steps
    const hasThinkingProcess = !!agentPlan || executionLog.length > 0;
    
    const hasFinalAnswer = finalAnswerText && finalAnswerText.trim() !== '';
    const duration = activeResponse?.startTime && activeResponse?.endTime ? (activeResponse.endTime - activeResponse.startTime) / 1000 : null;
    const autoPlayTriggered = useRef(false);

    useEffect(() => {
        if (isThinking && activeResponse?.startTime) {
            const intervalId = setInterval(() => setElapsed((Date.now() - activeResponse.startTime!) / 1000), 100);
            return () => clearInterval(intervalId);
        }
    }, [isThinking, activeResponse?.startTime]);

    const displayDuration = thinkingIsComplete && duration !== null ? duration.toFixed(1) : elapsed.toFixed(1);

    useEffect(() => {
        if (isAutoPlayEnabled && !autoPlayTriggered.current && thinkingIsComplete && hasFinalAnswer) {
            autoPlayTriggered.current = true;
            playOrStopAudio();
        }
    }, [isAutoPlayEnabled, thinkingIsComplete, hasFinalAnswer, playOrStopAudio]);

    const isInitialWait = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !activeResponse?.error && executionState !== 'pending_approval';
    const isStreamingFinalAnswer = !!isThinking && hasFinalAnswer && !activeResponse?.error;
    // We adjust waiting logic: if we have thinking process, we are NOT just waiting, we are showing the process.
    const isWaitingForFinalAnswer = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !activeResponse?.error && executionState !== 'pending_approval';
    const showApprovalUI = executionState === 'pending_approval' && activeResponse?.plan;

    const handleRunCode = useCallback((language: string, code: string) => {
        const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        sendMessage(userPrompt, undefined, { isThinkingModeEnabled: true });
    }, [sendMessage]);

    return {
        activeResponse, thinkingText, finalAnswerText, playOrStopAudio, audioState, isPlaying, searchSources,
        thinkingIsComplete, hasThinkingProcess, hasFinalAnswer, displayDuration, isInitialWait,
        isStreamingFinalAnswer, isWaitingForFinalAnswer, showApprovalUI, handleRunCode,
        agentPlan, executionLog // Export parsed workflow data
    };
};
