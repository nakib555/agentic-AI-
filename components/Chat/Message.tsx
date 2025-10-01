/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import type { Message, MessageError } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { TypingIndicator } from './TypingIndicator';
import { MarkdownComponents } from '../Markdown/markdownComponents';


// --- Error Display Component ---
const ErrorDisplay = ({ error }: { error: MessageError }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
    const getErrorMessageSuggestion = (code?: string): string | null => {
        switch (code) {
            case 'MODEL_NOT_FOUND':
                return 'The selected model could not be found. Please choose a different model from the selector at the top.';
            case 'INVALID_API_KEY':
                return 'Your API key is invalid or missing. Please ensure it is configured correctly.';
            case 'RATE_LIMIT_EXCEEDED':
                return 'You have sent too many requests. Please wait a moment before trying again.';
            case 'CONTENT_BLOCKED':
                return 'The response was blocked by the safety filter. Try rephrasing your request.';
            case 'TOOL_EXECUTION_FAILED':
                return 'A tool required by the AI failed to execute correctly. See details for more information.';
            case 'TOOL_NOT_FOUND':
                return 'The AI tried to use a tool that does not exist. This may be a model hallucination issue.';
            default:
                if (code?.startsWith('TOOL_')) {
                    return 'An error occurred while the AI was using one of its tools. Check the details for more technical information.';
                }
                return 'There was an unexpected error. Please try your request again.';
        }
    };
    
    const suggestion = getErrorMessageSuggestion(error.code);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[90%] sm:max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-4 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-red-500 dark:text-red-400 pt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <p className="font-semibold text-red-800 dark:text-red-200">{error.message}</p>
              {error.code && <span className="text-xs font-mono bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-md flex-shrink-0">{error.code}</span>}
            </div>
            
            {suggestion && <p className="text-sm text-red-700 dark:text-red-300 mt-2">{suggestion}</p>}

            {error.details && (
              <>
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
                >
                  {isDetailsOpen ? 'Hide Details' : 'Show Details'}
                </button>
                <AnimatePresence>
                  {isDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap font-['Fira_Code',_monospace]">
                        {error.details}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

// --- Main Message Component ---
export const MessageComponent: React.FC<{ msg: Message }> = ({ msg }) => {
  const { role, text, isThinking, toolCallEvents, error } = msg;

  const animationProps: MotionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  };
  
  // --- User Message ---
  if (role === 'user') {
    return (
      <motion.div {...animationProps} className="w-full flex justify-end">
        <div className="max-w-[85%] sm:max-w-2xl w-fit p-3 sm:p-4 rounded-2xl bg-purple-600 text-white rounded-br-none shadow-sm break-words">
          {text}
        </div>
      </motion.div>
    );
  }
  
  // --- AI Message Container ---
  if (role === 'model') {
    const finalAnswerMarker = '[STEP] Final Answer';
    const stepMarker = '[STEP]';
    const finalAnswerIndex = text.lastIndexOf(finalAnswerMarker);
    const hasThinkingSteps = text.includes(stepMarker);
    const thinkingIsComplete = !isThinking || !!error;

    let thinkingText = '';
    let finalAnswerText = '';

    if (finalAnswerIndex !== -1) {
        // Case 1: Ideal case with a final answer marker.
        thinkingText = text.substring(0, finalAnswerIndex);
        const rawFinalAnswer = text.substring(finalAnswerIndex + finalAnswerMarker.length);
        finalAnswerText = rawFinalAnswer.replace(/\[AUTO_CONTINUE\]/g, '').trim();
    } else if (thinkingIsComplete) {
        // Case 2: Thinking is complete, but the marker is missing. We need to parse.
        if (!hasThinkingSteps) {
            // Sub-case 2a: No steps at all, so the whole response is the final answer.
            thinkingText = '';
            finalAnswerText = text.trim();
        } else {
            // Sub-case 2b: There are steps. Assume everything that is not a step is the final answer.
            // This regex finds all step blocks.
            const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/g;
            const matches = [...text.matchAll(stepRegex)];
            
            if (matches.length > 0) {
                // Find the end of the last matched step block.
                const lastMatch = matches[matches.length - 1];
                const lastMatchEnd = (lastMatch.index || 0) + lastMatch[0].length;
                
                // Everything up to that point is considered thinking text.
                thinkingText = text.substring(0, lastMatchEnd);
                
                // Anything after the last step is the final answer.
                finalAnswerText = text.substring(lastMatchEnd).trim();
            } else {
                // Should not be reached due to `hasThinkingSteps` check, but as a fallback:
                thinkingText = '';
                finalAnswerText = text.trim();
            }
        }
    } else {
        // Case 3: We are still actively thinking. The entire text is part of the workflow.
        thinkingText = text;
        finalAnswerText = '';
    }

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
    )
  }

  return null;
};