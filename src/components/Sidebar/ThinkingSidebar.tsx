/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Message } from '../../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { parseMessageText } from '../../utils/messageParser';

type ThinkingSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    message: Message | null;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

const variants = {
    open: { width: '24rem' }, // w-96
    closed: { width: 0 },
};

export const ThinkingSidebar: React.FC<ThinkingSidebarProps> = ({ isOpen, onClose, message, sendMessage }) => {

    const thinkingContent = () => {
        if (!message) {
            return (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-slate-400">
                    No thought process to display.
                </div>
            );
        }

        const { thinkingText } = parseMessageText(message.text, !!message.isThinking, !!message.error);
        const thinkingIsComplete = !message.isThinking || !!message.error;
        const isLiveGeneration = !!message.isThinking && !message.error;

        if (!thinkingText && !message.error) {
             return (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-slate-400 p-4 text-center">
                    This message did not involve a complex thought process.
                </div>
            );
        }

        return (
             <ThinkingWorkflow
                text={thinkingText}
                toolCallEvents={message.toolCallEvents}
                isThinkingComplete={thinkingIsComplete}
                isLiveGeneration={isLiveGeneration}
                error={message.error}
                sendMessage={sendMessage}
            />
        );
    }


    return (
        <motion.aside
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            variants={variants}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="bg-gray-100 dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-white/10 flex-shrink-0 overflow-hidden"
            role="complementary"
            aria-labelledby="thinking-sidebar-title"
        >
            <div className="w-96 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <h2 id="thinking-sidebar-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">Thought Process</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20"
                        aria-label="Close thought process"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-4 min-h-0">
                    {thinkingContent()}
                </div>
            </div>
        </motion.aside>
    );
};