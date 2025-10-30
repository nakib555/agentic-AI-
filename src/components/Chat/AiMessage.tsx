/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
// FIX: Import `MotionProps` and use it as a type directly.
import { motion, AnimatePresence, type MotionProps } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import type { Message, Source } from '../../../types';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';
import { ImageDisplay } from '../AI/ImageDisplay';
import { VideoDisplay } from '../AI/VideoDisplay';
import { SourcesPills } from '../AI/SourcesPills';
import { DownloadRawResponseButton } from './DownloadRawResponseButton';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { TypingIndicator } from './TypingIndicator';
import { TypingWrapper } from '../AI/TypingWrapper';
import { McqComponent } from '../AI/McqComponent';
import { MapDisplay } from '../AI/MapDisplay';
import { decode, decodeAudioData } from '../../utils/audioUtils';
import { audioCache } from '../../services/audioCache';
import { audioManager } from '../../services/audioService';
import { FileAttachment } from '../AI/FileAttachment';
import { PinButton } from './PinButton';
import { SuggestedActions } from './SuggestedActions';
import { ExecutionApproval } from '../AI/ExecutionApproval';
import type { MessageFormHandle } from './MessageForm';
import { TtsButton } from './AiMessage/TtsButton';
import { cleanTextForTts } from './AiMessage/utils';


const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const AiMessage: React.FC<{ 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onTogglePin: (chatId: string, messageId: string) => void;
    onShowThinkingProcess: (messageId: string) => void;
    approveExecution: () => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
}> = ({ 
    msg, isLoading, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, onTogglePin, 
    onShowThinkingProcess, approveExecution, denyExecution, messageFormRef
}) => {
  const { id, text, isThinking, error, startTime, endTime, isPinned, suggestedActions, plan, executionState } = msg;
  const [elapsed, setElapsed] = useState(0);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'error' | 'playing'>('idle');
  const isPlaying = audioState === 'playing';

  const { thinkingText, finalAnswerText } = useMemo(
    () => parseMessageText(text, !!isThinking, !!error),
    [text, isThinking, error]
  );
  
  const searchSources = useMemo((): Source[] => {
    if (!msg.toolCallEvents || msg.toolCallEvents.length === 0) {
      return [];
    }

    const allSources: Source[] = [];
    const searchEvents = msg.toolCallEvents.filter(
      event => event.call.name === 'duckduckgoSearch' && event.result
    );

    const parseMarkdownLinks = (markdown: string): Source[] => {
        const sources: Source[] = [];
        if (!markdown) return sources;
        const regex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = regex.exec(markdown)) !== null) {
            sources.push({ title: match[1].trim(), uri: match[2].trim() });
        }
        return sources;
    };

    for (const event of searchEvents) {
      const sourcesMatch = event.result!.match(/\[SOURCES_PILLS\]([\s\S]*?)\[\/SOURCES_PILLS\]/s);
      if (sourcesMatch && sourcesMatch[1]) {
        const markdownContent = sourcesMatch[1].trim();
        allSources.push(...parseMarkdownLinks(markdownContent));
      }
    }

    // Deduplicate sources based on URI
    return Array.from(new Map(allSources.map(s => [s.uri, s])).values());
  }, [msg.toolCallEvents]);
  
  const thinkingIsComplete = !isThinking || !!error;
  const hasThinkingProcess = thinkingText && thinkingText.trim() !== '';
  const hasFinalAnswer = finalAnswerText && finalAnswerText.trim() !== '';

  const duration = startTime && endTime ? (endTime - startTime) / 1000 : null;
  const autoPlayTriggered = useRef(false);

  // Timer effect: starts when `isThinking` is true and a `startTime` exists.
  useEffect(() => {
    if (isThinking && startTime) {
        const intervalId = setInterval(() => {
            const seconds = (Date.now() - startTime) / 1000;
            setElapsed(seconds);
        }, 100);
        return () => clearInterval(intervalId);
    }
  }, [isThinking, startTime]);

  const displayDuration = thinkingIsComplete && duration !== null ? duration.toFixed(1) : elapsed.toFixed(1);

  // A stable, memoized function to handle playing or stopping audio.
  const playOrStopAudio = useCallback(async () => {
    // This function reads the latest state via a functional update to decide its action.
    // This makes the callback itself stable and avoids dependency-related issues.
    let shouldStartPlayback = false;
    setAudioState(currentState => {
        if (currentState === 'playing') {
            audioManager.stop();
            return 'idle';
        }
        if (currentState === 'loading') {
            return 'loading';
        }
        shouldStartPlayback = true;
        return 'loading';
    });

    if (!shouldStartPlayback || !finalAnswerText) {
        return;
    }
    
    const textToSpeak = cleanTextForTts(finalAnswerText);
    if (!textToSpeak) {
        console.error("TTS failed: No text to speak after cleaning.");
        setAudioState('error');
        return;
    }
      
    const cacheKey = audioCache.createKey(textToSpeak, ttsVoice);
    const cachedBuffer = audioCache.get(cacheKey);

    const doPlay = async (buffer: AudioBuffer) => {
        setAudioState('playing');
        await audioManager.play(buffer, () => setAudioState('idle'));
    };

    if (cachedBuffer) {
        await doPlay(cachedBuffer);
        return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoice } } },
            },
        });

        let base64Audio: string | undefined;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                    base64Audio = part.inlineData.data;
                    break;
                }
            }
        }
        
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioManager.context, 24000, 1);
            audioCache.set(cacheKey, audioBuffer);
            await doPlay(audioBuffer);
        } else {
            throw new Error("No audio data returned.");
        }
    } catch (err) {
        console.error("TTS failed:", err);
        setAudioState('error');
    }
  }, [finalAnswerText, ttsVoice]);

  // Effect to handle auto-play functionality.
  useEffect(() => {
    if (isAutoPlayEnabled && !autoPlayTriggered.current && thinkingIsComplete && hasFinalAnswer) {
      autoPlayTriggered.current = true;
      playOrStopAudio();
    }
  }, [isAutoPlayEnabled, thinkingIsComplete, hasFinalAnswer, playOrStopAudio]);

  // State 1: The initial wait, before any text or workflow has been generated.
  const isInitialWait = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !error && executionState !== 'pending_approval';
  
  // State 2: The workflow is visible, and the final answer is actively being streamed.
  const isStreamingFinalAnswer = !!isThinking && hasFinalAnswer && !error;
  
  // State 3: The workflow is visible, but we are still waiting for the final answer to start.
  const isWaitingForFinalAnswer = !!isThinking && hasThinkingProcess && !hasFinalAnswer && !error && executionState !== 'pending_approval';

  const handleRunCode = useCallback((language: string, code: string) => {
    // This prompt is more explicit and aligns with how the agent expects to receive tasks.
    const userPrompt = `Please execute the following ${language} code block:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    sendMessage(userPrompt, undefined, { isThinkingModeEnabled: true });
  }, [sendMessage]);

  /**
   * A renderer that progressively displays text and UI components.
   * It parses the text for special component tags and only renders a component
   * when the "typed" text has fully revealed its tag.
   * It also strips incomplete tags from the end of the streaming text to prevent flicker.
   */
  const renderProgressiveAnswer = (text: string, isStreaming: boolean) => {
    const componentRegex = /(\[(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\].*?\[\/(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\])/s;
    const parts = text.split(componentRegex).filter(part => part);

    return parts.map((part, index) => {
        const videoMatch = part.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
        const onlineVideoMatch = part.match(/\[ONLINE_VIDEO_COMPONENT\](\{.*?\})\[\/ONLINE_VIDEO_COMPONENT\]/s);
        const imageMatch = part.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);
        const onlineImageMatch = part.match(/\[ONLINE_IMAGE_COMPONENT\](\{.*?\})\[\/ONLINE_IMAGE_COMPONENT\]/s);
        const mcqMatch = part.match(/\[MCQ_COMPONENT\](\{.*?\})\[\/MCQ_COMPONENT\]/s);
        const mapMatch = part.match(/\[MAP_COMPONENT\](\{.*?\})\[\/MAP_COMPONENT\]/s);
        const fileAttachmentMatch = part.match(/\[FILE_ATTACHMENT_COMPONENT\](\{.*?\})\[\/FILE_ATTACHMENT_COMPONENT\]/s);

        const renderError = (component: string, details: string) => (
            <ErrorDisplay key={`${id}-${index}`} error={{ message: `Failed to render ${component} component due to invalid data.`, details }} />
        );

        const handleEdit = (blob: Blob, key: string) => {
            const file = new File([blob], "image-to-edit.png", { type: blob.type });
            // Attach the unique key to the file object to check for duplicates later.
            (file as any)._editKey = key;
            messageFormRef.current?.attachFiles([file]);
        };
        
        if (videoMatch) {
            try {
                const videoData = JSON.parse(videoMatch[1]);
                return <VideoDisplay key={`${id}-${index}`} {...videoData} />;
            } catch (e) {
                console.error("Failed to parse video JSON:", e);
                return renderError('video', videoMatch[1]);
            }
        }
        
        if (onlineVideoMatch) {
            try {
                const videoData = JSON.parse(onlineVideoMatch[1]);
                // The VideoDisplay component expects `srcUrl` and `prompt` (for caption/title)
                return <VideoDisplay key={`${id}-${index}`} srcUrl={videoData.url} prompt={videoData.title} />;
            } catch (e) {
                console.error("Failed to parse online video JSON:", e);
                return renderError('online video', onlineVideoMatch[1]);
            }
        }

        if (imageMatch) {
            try {
                const imageData = JSON.parse(imageMatch[1]);
                return <ImageDisplay key={`${id}-${index}`} onEdit={handleEdit} {...imageData} />;
            } catch (e) {
                console.error("Failed to parse image JSON:", e);
                return renderError('image', imageMatch[1]);
            }
        }
        
        if (onlineImageMatch) {
            try {
                const imageData = JSON.parse(onlineImageMatch[1]);
                return <ImageDisplay key={`${id}-${index}`} onEdit={handleEdit} {...imageData} />;
            } catch (e) {
                console.error("Failed to parse online image JSON:", e);
                return renderError('online image', onlineImageMatch[1]);
            }
        }

        if (mcqMatch) {
            try {
                const mcqData = JSON.parse(mcqMatch[1]);
                return <McqComponent key={`${id}-${index}`} {...mcqData} />;
            } catch (e) {
                console.error("Failed to parse MCQ JSON:", e);
                return renderError('MCQ', mcqMatch[1]);
            }
        }

        if (mapMatch) {
            try {
                const mapData = JSON.parse(mapMatch[1]);
                return (
                    <motion.div
                        key={`${id}-${index}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                    >
                        <MapDisplay {...mapData} />
                    </motion.div>
                );
            } catch (e) {
                console.error("Failed to parse map JSON:", e);
                return renderError('map', mapMatch[1]);
            }
        }

        if (fileAttachmentMatch) {
            try {
                const attachmentData = JSON.parse(fileAttachmentMatch[1]);
                return <FileAttachment key={`${id}-${index}`} {...attachmentData} />;
            } catch (e) {
                console.error("Failed to parse file attachment JSON:", e);
                return renderError('file attachment', fileAttachmentMatch[1]);
            }
        }
        
        // This new, more robust regex correctly identifies the start of any component tag
        // and removes it and everything that follows from the final streaming part.
        // This prevents raw, incomplete JSON or markdown from flickering in the UI.
        const incompleteTagRegex = /\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\].*$/s;
        const cleanedPart = part.replace(incompleteTagRegex, '');

        if (cleanedPart) {
            return <ManualCodeRenderer 
                key={`${id}-${index}`} 
                text={cleanedPart} 
                components={MarkdownComponents} 
                isStreaming={isStreaming} 
                onRunCode={handleRunCode}
                isRunDisabled={isLoading}
            />;
        }
        return null;
    });
  };

  // If we're in the initial waiting state, render only the indicator.
  if (isInitialWait) {
    return <TypingIndicator />;
  }

  // --- Render Interactive Planning UI ---
  if (executionState === 'pending_approval' && plan) {
    return (
        <ExecutionApproval 
            plan={plan}
            onApprove={approveExecution}
            onDeny={denyExecution}
        />
    );
  }

  return (
    <motion.div {...animationProps} className="w-full flex flex-col items-start gap-4">
      {/* RENDER THINKING PROCESS FIRST */}
      {hasThinkingProcess && (
            <button
                onClick={() => onShowThinkingProcess(id)}
                className="w-full max-w-[90%] flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-black/30 transition-colors text-left"
                aria-controls="thinking-sidebar"
                title="Show thought process"
            >
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-slate-400">
                        <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-gray-700 dark:text-slate-200 text-sm">
                        {thinkingIsComplete ? `Thought took ${displayDuration}s` : `Thinking for ${displayDuration}s`}
                    </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-slate-400">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L12.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </button>
        )}
      
      {/* AI Message Content */}
      {/* This container has no visible styling; its content renders directly on the chat background. */}
      {(hasFinalAnswer || error || isWaitingForFinalAnswer) && (
        <div className="w-full max-w-[90%] flex flex-col gap-4">
          {isWaitingForFinalAnswer && <TypingIndicator />}
          
          {error && <ErrorDisplay error={error} />}

          {hasFinalAnswer && !error && (
              <div className="markdown-content max-w-none w-full">
                  <TypingWrapper 
                    fullText={finalAnswerText} 
                    isAnimating={isStreamingFinalAnswer}
                  >
                    {(displayedText) => renderProgressiveAnswer(
                        isStreamingFinalAnswer ? displayedText : finalAnswerText,
                        isStreamingFinalAnswer
                    )}
                  </TypingWrapper>
              </div>
          )}
        </div>
      )}

      {thinkingIsComplete && searchSources.length > 0 && !error && (
        <div className="w-full max-w-[90%]">
          <SourcesPills sources={searchSources} />
        </div>
      )}

      {thinkingIsComplete && suggestedActions && suggestedActions.length > 0 && !error && (
         <div className="w-full max-w-[90%]">
            <SuggestedActions actions={suggestedActions} onActionClick={(action) => sendMessage(action)} />
         </div>
      )}
      
      {thinkingIsComplete && text && !error && (
          <div className="flex items-center gap-2">
            <DownloadRawResponseButton rawText={text} />
            {hasFinalAnswer && <TtsButton isPlaying={isPlaying} isLoading={audioState === 'loading'} onClick={playOrStopAudio} />}
            <PinButton 
                isPinned={!!isPinned}
                onClick={() => {
                    if (currentChatId) {
                        onTogglePin(currentChatId, id);
                    }
                }}
            />
            <AnimatePresence>
                {audioState === 'error' && (
                    <motion.div 
                        initial={{opacity: 0, y: 5}} 
                        animate={{opacity: 1, y: 0}} 
                        exit={{opacity: 0, y: 5}} 
                        className="text-xs text-red-500 dark:text-red-400"
                    >
                        Audio synthesis failed.
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
      )}
    </motion.div>
  );
};