/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../../types';

const PinnedMessageItem: React.FC<{ 
    message: Message;
    onJumpTo: () => void;
    onUnpin: () => void;
}> = ({ message, onJumpTo, onUnpin }) => {
    
    const textSnippet = message.text.length > 80 ? message.text.substring(0, 80) + '…' : message.text;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-shrink-0 w-64 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 p-2 flex items-start gap-3"
        >
            <button onClick={onJumpTo} className="flex-1 flex items-start gap-2 min-w-0 text-left">
                <div className="flex-shrink-0 text-yellow-500 dark:text-yellow-400 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M6 1.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-1v2.122c1.32.263 2.5 1.01 2.5 2.128v5.25a.75.75 0 0 1-1.5 0V7.5a1.25 1.25 0 0 0-1-1.222V4.128A2.75 2.75 0 0 0 8 1.406V2.5H7A.75.75 0 0 1 6 1.75Z" /><path d="M3.75 6A.75.75 0 0 0 3 6.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 3.75 6ZM12.25 6a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5a.75.75 0 0 0-.75-.75Z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{message.role === 'user' ? 'You' : 'AI'}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{textSnippet}</p>
                </div>
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onUnpin(); }}
                className="flex-shrink-0 p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-300/50 dark:hover:bg-black/30"
                aria-label="Unpin message"
                title="Unpin message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
            </button>
        </motion.div>
    );
};


export const PinnedMessagesBar: React.FC<{
    messages: Message[];
    currentChatId: string | null;
    onUnpin: (messageId: string) => void;
}> = ({ messages, currentChatId, onUnpin }) => {
    const pinnedMessages = messages.filter(msg => msg.isPinned);

    const handleJumpTo = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!currentChatId || pinnedMessages.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            {pinnedMessages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-shrink-0 px-4 sm:px-6 md:px-8 pt-4"
                >
                    <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">Pinned Messages</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
                             <AnimatePresence>
                                {pinnedMessages.map(msg => (
                                    <PinnedMessageItem
                                        key={msg.id}
                                        message={msg}
                                        onJumpTo={() => handleJumpTo(msg.id)}
                                        onUnpin={() => onUnpin(msg.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};