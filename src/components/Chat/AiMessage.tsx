/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { TypingIndicator } from './TypingIndicator';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';
import { MapDisplay } from '../AI/MapDisplay';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const renderFinalAnswer = (text: string) => {
    const mapRegex = /\[MAP_COMPONENT\](\{.*?\})\[\/MAP_COMPONENT\]/s;
    const parts = text.split(mapRegex);

    return parts.map((part, index) => {
        if (index % 2 === 1) { // This is the JSON part
            try {
                const mapData = JSON.parse(part);
                return <MapDisplay key={index} {...mapData} />;
            } catch (e) {
                console.error("Failed to parse map JSON:", e);
                // FIX: Pass the key to a wrapping React.Fragment to avoid TypeScript errors with component prop types.
                return <React.Fragment key={index}><ErrorDisplay error={{ message: "Failed to render map component due to invalid data.", details: part }} /></React.Fragment>;
            }
        } else if (part) { // This is the regular text part, ensure it's not empty
            return (
                <ReactMarkdown
                    key={index}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={MarkdownComponents}
                >
                    {part}
                </ReactMarkdown>
            );
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
    </motion.div>
  );
};