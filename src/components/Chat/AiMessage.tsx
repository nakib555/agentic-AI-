/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, MotionProps, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';
import { ImageDisplay } from '../AI/ImageDisplay';
import { VideoDisplay } from '../AI/VideoDisplay';
import { GoogleSearchResults } from '../AI/GoogleSearchResults';
import { DownloadRawResponseButton } from './DownloadRawResponseButton';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { FormattedBlock } from '../Markdown/FormattedBlock';
import { TypingIndicator } from './TypingIndicator';
import { TypingWrapper } from '../AI/TypingWrapper';
import { McqComponent } from '../AI/McqComponent';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const AiMessage: React.FC<{ msg: Message; sendMessage: (message: string, files?: File[]) => void; }> = ({ msg, sendMessage }) => {
  const { id, text, isThinking, toolCallEvents, error, startTime, endTime } = msg;
  const [isThinkingDetailsVisible, setIsThinkingDetailsVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const { thinkingText, finalAnswerText } = useMemo(
    () => parseMessageText(text, !!isThinking, !!error),
    [text, isThinking, error]
  );
  
  const thinkingIsComplete = !isThinking || !!error;
  const hasThinkingProcess = thinkingText && thinkingText.trim() !== '';
  const hasFinalAnswer = finalAnswerText && finalAnswerText.trim() !== '';

  const duration = startTime && endTime ? (endTime - startTime) / 1000 : null;

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

  // State 1: The initial wait, before any text or workflow has been generated.
  const isInitialWait = !!isThinking && !hasThinkingProcess && !hasFinalAnswer && !error;
  
  // State 2: The workflow is visible, and the final answer is actively being streamed.
  const isStreamingFinalAnswer = !!isThinking && hasFinalAnswer && !error;
  
  // State 3: The workflow is visible, but we are still waiting for the final answer to start.
  const isWaitingForFinalAnswer = !!isThinking && hasThinkingProcess && !hasFinalAnswer && !error;

  /**
   * A renderer that progressively displays text and UI components.
   * It parses the text for special component tags and only renders a component
   * when the "typed" text has fully revealed its tag.
   * It also strips incomplete tags from the end of the streaming text to prevent flicker.
   */
  const renderProgressiveAnswer = (text: string) => {
    const componentRegex = /(\[(?:VIDEO|IMAGE|GOOGLE_SEARCH_RESULTS|FORMATTED_BLOCK|MCQ_COMPONENT)\].*?\[\/(?:VIDEO|IMAGE|GOOGLE_SEARCH_RESULTS|FORMATTED_BLOCK|MCQ_COMPONENT)\])/s;
    const parts = text.split(componentRegex).filter(part => part);

    return parts.map((part, index) => {
        const videoMatch = part.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
        const imageMatch = part.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);
        const googleSearchMatch = part.match(/\[GOOGLE_SEARCH_RESULTS\](\{.*?\})\[\/GOOGLE_SEARCH_RESULTS\]/s);
        const formattedBlockMatch = part.match(/\[FORMATTED_BLOCK_COMPONENT\](.*?)\[\/FORMATTED_BLOCK_COMPONENT\]/s);
        const mcqMatch = part.match(/\[MCQ_COMPONENT\](\{.*?\})\[\/MCQ_COMPONENT\]/s);

        const renderError = (component: string, details: string) => (
            <ErrorDisplay key={`${id}-${index}`} error={{ message: `Failed to render ${component} component due to invalid data.`, details }} />
        );
        
        if (videoMatch) {
            try {
                const videoData = JSON.parse(videoMatch[1]);
                return <VideoDisplay key={`${id}-${index}`} {...videoData} />;
            } catch (e) {
                console.error("Failed to parse video JSON:", e);
                return renderError('video', videoMatch[1]);
            }
        }
        
        if (imageMatch) {
            try {
                const imageData = JSON.parse(imageMatch[1]);
                return <ImageDisplay key={`${id}-${index}`} {...imageData} />;
            } catch (e) {
                console.error("Failed to parse image JSON:", e);
                return renderError('image', imageMatch[1]);
            }
        }

        if (googleSearchMatch) {
            try {
                const searchData = JSON.parse(googleSearchMatch[1]);
                return <GoogleSearchResults key={`${id}-${index}`} {...searchData} />;
            } catch (e) {
                console.error("Failed to parse Google Search JSON:", e);
                return renderError('Google Search', googleSearchMatch[1]);
            }
        }

        if (formattedBlockMatch) {
            try {
                const content = formattedBlockMatch[1];
                return <FormattedBlock key={`${id}-${index}`} content={content} />;
            } catch (e) {
                console.error("Failed to parse formatted block:", e);
                return renderError('formatted block', part);
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
        
        const cleanedPart = part.replace(/\[(VIDEO|IMAGE|GOOGLE_SEARCH_RESULTS|FORMATTED_BLOCK|MCQ_COMPONENT)[^\]]*$/, '');
        if (cleanedPart) {
            return <ManualCodeRenderer key={`${id}-${index}`} text={cleanedPart} components={MarkdownComponents} />;
        }
        return null;
    });
};

  // If we're in the initial waiting state, render only the indicator.
  if (isInitialWait) {
    return <TypingIndicator />;
  }

  return (
    <motion.div {...animationProps} className="w-full flex flex-col items-start gap-4">
        {hasThinkingProcess && (
            <>
                <button
                    onClick={() => setIsThinkingDetailsVisible(prev => !prev)}
                    className="w-full max-w-[90%] flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#2D2D2D] dark:bg-[#202123] hover:bg-opacity-90 transition-colors text-left"
                    aria-expanded={isThinkingDetailsVisible}
                    aria-controls={`thinking-details-${id}`}
                    title={isThinkingDetailsVisible ? "Collapse thought process" : "Expand thought process"}
                >
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                            <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-slate-200 text-sm">
                            {thinkingIsComplete ? `Thought took ${displayDuration}s` : `Thinking for ${displayDuration}s`}
                        </span>
                    </div>
                    <motion.div animate={{ rotate: isThinkingDetailsVisible ? 0 : -90 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isThinkingDetailsVisible && (
                        <motion.div
                            id={`thinking-details-${id}`}
                            initial="collapsed" animate="open" exit="collapsed"
                            variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="w-full"
                        >
                            <ThinkingWorkflow 
                                text={thinkingText} 
                                toolCallEvents={toolCallEvents}
                                isThinkingComplete={thinkingIsComplete}
                                isLiveGeneration={!!isThinking}
                                error={error}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )}
        
        {isWaitingForFinalAnswer && <TypingIndicator />}
        
        {error && <ErrorDisplay error={error} />}

        {hasFinalAnswer && !error && (
             <div className="markdown-content max-w-none w-full">
                <TypingWrapper 
                  fullText={finalAnswerText} 
                  isAnimating={isStreamingFinalAnswer}
                >
                  {(displayedText) => renderProgressiveAnswer(isStreamingFinalAnswer ? displayedText : finalAnswerText)}
                </TypingWrapper>
            </div>
        )}

        {thinkingIsComplete && text && !error && (
            <DownloadRawResponseButton rawText={text} />
        )}
    </motion.div>
  );
};