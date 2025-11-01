/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
// FIX: Correct the relative import path for types.
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { parseMessageText } from '../../utils/messageParser';
import { useViewport } from '../../hooks/useViewport';

type ThinkingSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    message: Message | null;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

// Mobile variants for bottom-up animation
const mobileVariants = {
  open: { height: '50vh', y: 0 },
  closed: { height: 0, y: '100%' },
};

// Desktop variants for side-in animation
const desktopVariants = {
    open: { width: '24rem' }, // w-96
    closed: { width: 0 },
};

export const ThinkingSidebar: React.FC<ThinkingSidebarProps> = ({ isOpen, onClose, message, sendMessage }) => {
    const { isDesktop } = useViewport();

    // Select the appropriate variants based on screen size
    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isOpen ? 'open' : 'closed';

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
            animate={animateState}
            variants={variants}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className={`
                flex-shrink-0 overflow-hidden
                ${isDesktop 
                    ? 'relative border-l border-gray-200 dark:border-white/10' // Desktop styling
                    : 'fixed inset-x-0 bottom-0 z-30 bg-gray-100 dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10' // Mobile styling
                }
            `}
            role="complementary"
            aria-labelledby="thinking-sidebar-title"
        >
            <div className={`flex flex-col h-full ${isDesktop ? 'w-96' : 'w-full'}`}>
                {/* Drag handle for mobile (decorative) */}
                {!isDesktop && isOpen && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2.5 h-1.5 w-16 bg-gray-300 dark:bg-slate-600 rounded-full cursor-grab"
                         aria-hidden="true" // Decorative, not interactive
                    ></div>
                )}
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