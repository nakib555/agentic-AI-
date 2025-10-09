/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { TypingIndicator } from './TypingIndicator';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';
// FIX: The MapDisplay component is not implemented, causing a build error.
// import { MapDisplay } from '../AI/MapDisplay';
import { ImageDisplay } from '../AI/ImageDisplay';
import { VideoDisplay } from '../AI/VideoDisplay';
import { DownloadRawResponseButton } from './DownloadRawResponseButton';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { FormattedBlock } from '../Markdown/FormattedBlock';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const renderFinalAnswer = (text: string) => {
    // This regex splits the text by component tags, keeping the tags in the result array.
    const componentRegex = /(\[(?:VIDEO|IMAGE)_COMPONENT\].*?\[\/(?:VIDEO|IMAGE)_COMPONENT\]|\[FORMATTED_BLOCK\].*?\[\/FORMATTED_BLOCK\])/s;
    const parts = text.split(componentRegex).filter(part => part);

    return parts.map((part, index) => {
        const videoMatch = part.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
        const imageMatch = part.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);
        const formattedBlockMatch = part.match(/\[FORMATTED_BLOCK\](.*?)\[\/FORMATTED_BLOCK\]/s);

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

        if (formattedBlockMatch) {
            try {
                const content = formattedBlockMatch[1];
                return <FormattedBlock key={index} content={content} />;
            } catch (e) {
                console.error("Failed to parse formatted block:", e);
                return renderError('formatted block', part);
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
  const [isThinkingVisible, setIsThinkingVisible] = useState(true);

  // The parser now uses the `isThinking` and `error` flags to prevent flickering.
  const { thinkingText, finalAnswerText } = useMemo(
    () => parseMessageText(text, !!isThinking, !!error),
    [text, isThinking, error]
  );
  
  const thinkingIsComplete = !isThinking || !!error;
  
  const hasThinkingProcess = thinkingText && thinkingText.trim() !== '';

  return (
    <motion.div {...animationProps} className="w-full flex flex-col items-start gap-4">
        {hasThinkingProcess && (
            <ThinkingWorkflow 
                text={thinkingText} 
                toolCallEvents={toolCallEvents}
                isThinkingComplete={thinkingIsComplete}
                error={error}
                duration={null}
                startTime={undefined}
                isVisible={isThinkingVisible}
                onToggleVisibility={() => setIsThinkingVisible(!isThinkingVisible)}
            />
        )}
        
        <AnimatePresence>
            {isThinking && !finalAnswerText && !error && <TypingIndicator />}
        </AnimatePresence>

        {/* If an error occurred, display it prominently. This makes the error clear to the user. */}
        {error && <ErrorDisplay error={error} />}

        {/* Only render the final answer if there's text AND no error occurred. */}
        {finalAnswerText && !error && (
             <div className="markdown-content max-w-none w-full max-w-[90%]">
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