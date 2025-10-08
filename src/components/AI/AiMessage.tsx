/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { TypingIndicator } from '../Chat/TypingIndicator';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';
import { ImageDisplay } from '../AI/ImageDisplay';
import { VideoDisplay } from '../AI/VideoDisplay';
import { DownloadRawResponseButton } from '../Chat/DownloadRawResponseButton';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const renderFinalAnswer = (text: string) => {
    // This regex splits the text by component tags, keeping the tags in the result array.
    const componentRegex = /(\[(?:VIDEO|IMAGE)_COMPONENT\].*?\[\/(?:VIDEO|IMAGE)_COMPONENT\])/s;
    const parts = text.split(componentRegex).filter(part => part);

    return parts.map((part, index) => {
        const videoMatch = part.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
        const imageMatch = part.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);

        const renderError = (component: string, details: string) => (
            <ErrorDisplay key={index} error={{ message: `Failed to render ${component} component due to invalid data.`, details }} />
        );
        
        if (videoMatch) {
            try {
                const videoData = JSON.parse(videoMatch[1]);
                return <VideoDisplay key={index} {...videoData} />;
            } catch (e) {
                console.error("Failed to parse video JSON:", e);
                return renderError('video', videoMatch[1]);
            }
        }
        
        if (imageMatch) {
            try {
                const imageData = JSON.parse(imageMatch[1]);
                return <ImageDisplay key={index} {...imageData} />;
            } catch (e) {
                console.error("Failed to parse image JSON:", e);
                return renderError('image', imageMatch[1]);
            }
        }
        
        // If no component tag is matched, render as standard markdown.
        if (part) {
            return <ManualCodeRenderer key={index} text={part} components={MarkdownComponents} />;
        }
        
        return null;
    });
};

export const AiMessage: React.FC<{ msg: Message }> = ({ msg }) => {
  const { text, isThinking, toolCallEvents, error } = msg;

  const { thinkingText, finalAnswerText } = useMemo(
    () => parseMessageText(text, !!isThinking),
    [text, isThinking]
  );
  
  const thinkingIsComplete = !isThinking || !!error;

  return (
    <motion.div {...animationProps} className="w-full flex flex-col items-start gap-4">
        <ThinkingWorkflow 
            text={thinkingText} 
            toolCallEvents={toolCallEvents}
            isThinkingComplete={thinkingIsComplete}
            error={error}
        />
        
        <AnimatePresence>
            {isThinking && !finalAnswerText && !error && <TypingIndicator />}
        </AnimatePresence>

        {/* Render a separate error message only if the workflow is not displayed (e.g., error on first turn) */}
        {error && !thinkingText && <ErrorDisplay error={error} />}

        {finalAnswerText && (
             <div className="markdown-content max-w-none w-full max-w-[90%] sm:max-w-2xl">
                {renderFinalAnswer(finalAnswerText)}
            </div>
        )}

        {/* Add download button when response is complete and not an error */}
        {thinkingIsComplete && text && !error && (
            <DownloadRawResponseButton rawText={text} />
        )}
    </motion.div>
  );
};