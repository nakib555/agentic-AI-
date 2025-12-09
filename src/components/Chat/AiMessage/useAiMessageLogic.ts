
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Message, ModelResponse, Source } from '../../../types';
import { parseMessageText } from '../../../utils/messageParser';
import { useTts } from '../../../hooks/useTts';
import { parseAgenticWorkflow } from '../../../services/workflowParser';

export type RenderSegment = {
    type: 'text' | 'component';
    content?: string;
    componentType?: 'VIDEO' | 'ONLINE_VIDEO' | 'IMAGE' | 'ONLINE_IMAGE' | 'MCQ' | 'MAP' | 'FILE' | 'BROWSER';
    data?: any;
};

export const useAiMessageLogic = (
    msg: Message,
    ttsVoice: string,
    ttsModel: string,
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

    const { playOrStopAudio, audioState, isPlaying } = useTts(finalAnswerText, ttsVoice, ttsModel);

    // Extract sources from both tool calls and grounding metadata
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

    // Parse final answer into renderable segments (text vs components)
    const parsedFinalAnswer = useMemo((): RenderSegment[] => {
        if (!finalAnswerText) return [];

        const componentRegex = /(\[(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT)\].*?\[\/(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT)\])/s;
        const parts = finalAnswerText.split(componentRegex).filter(part => part);

        return parts.map((part): RenderSegment => {
            const componentMatch = part.match(/^\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT)\](\{.*?\})\[\/\1\]$/s);
            
            if (componentMatch) {
                try {
                    const typeMap: Record<string, string> = {
                        'VIDEO_COMPONENT': 'VIDEO',
                        'ONLINE_VIDEO_COMPONENT': 'ONLINE_VIDEO',
                        'IMAGE_COMPONENT': 'IMAGE',
                        'ONLINE_IMAGE_COMPONENT': 'ONLINE_IMAGE',
                        'MCQ_COMPONENT': 'MCQ',
                        'MAP_COMPONENT': 'MAP',
                        'FILE_ATTACHMENT_COMPONENT': 'FILE',
                        'BROWSER_COMPONENT': 'BROWSER'
                    };
                    return {
                        type: 'component',
                        componentType: typeMap[componentMatch[1]] as any,
                        data: JSON.parse(componentMatch[2])
                    };
                } catch (e) {
                    // Fallback if JSON parse fails
                    return { type: 'text', content: part };
                }
            }
            
            // Handle any incomplete tags at the end of the stream or plain text
            const incompleteTagRegex = /\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT)\].*$/s;
            const cleanedPart = part.replace(incompleteTagRegex, '');
            
            return { type: 'text', content: cleanedPart };
        }).filter(segment => segment.type === 'component' || (segment.content && segment.content.trim() !== ''));

    }, [finalAnswerText]);

    // We now consider "having thinking process" true if we have a plan OR execution steps
    const hasThinkingProcess = !!agentPlan || executionLog.length > 0;
    
    const hasFinalAnswer = finalAnswerText && finalAnswerText.trim() !== '';
    const duration = activeResponse?.startTime && activeResponse?.endTime ? (activeResponse.endTime - activeResponse.startTime) / 1000 : null;
    
    // Duration timer
    useEffect(() => {
        if (isThinking && activeResponse?.startTime) {
            const intervalId = setInterval(() => setElapsed((Date.now() - activeResponse.startTime!) / 1000), 100);
            return () => clearInterval(intervalId);
        }
    }, [isThinking, activeResponse?.startTime]);

    const displayDuration = thinkingIsComplete && duration !== null ? duration.toFixed(1) : elapsed.toFixed(1);

    const isStreamingFinalAnswer = !!isThinking && hasFinalAnswer && !activeResponse?.error;
    // We adjust waiting logic: if we have thinking process, we are NOT just waiting, we are showing the process.
    const isWaitingForFinalAnswer = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !activeResponse?.error && executionState !== 'pending_approval';
    
    // showApprovalUI logic
    const showApprovalUI = executionState === 'pending_approval' && !!activeResponse?.plan;

    const handleRunCode = useCallback((language: string, code: string) => {
        const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        sendMessage(userPrompt, undefined, { isThinkingModeEnabled: true });
    }, [sendMessage]);

    return {
        activeResponse, thinkingText, finalAnswerText, playOrStopAudio, audioState, isPlaying, searchSources,
        thinkingIsComplete, hasThinkingProcess, hasFinalAnswer, displayDuration, isInitialWait: !hasThinkingProcess && isWaitingForFinalAnswer,
        isStreamingFinalAnswer, isWaitingForFinalAnswer, showApprovalUI, handleRunCode,
        agentPlan, executionLog, parsedFinalAnswer
    };
};
