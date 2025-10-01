/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { TypingIndicator } from './TypingIndicator';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { parseMessageText } from '../../utils/messageParser';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
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
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                    components={MarkdownComponents}
                >
                    {finalAnswerText}
                </ReactMarkdown>
            </div>
        )}
    </motion.div>
  );
};