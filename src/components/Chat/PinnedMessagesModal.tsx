/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Message } from '../../types';

type PinnedMessageItemProps = {
    message: Message;
    onJumpTo: (messageId: string) => void;
    onUnpin: (messageId: string) => void;
};

const PinnedMessageItem: React.FC<PinnedMessageItemProps> = ({ message, onJumpTo, onUnpin }) => {
    const textSnippet = message.text.length > 150 ? message.text.substring(0, 150) + '…' : message.text;

    return (
        <div className="p-3 border-b border-gray-200 dark:border-white/10 last:border-b-0">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-gray-400 dark:text-slate-500 mt-1">
                    {message.role === 'user'
                        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></svg>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-slate-400">{textSnippet}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => onJumpTo(message.id)} className="text-xs font-semibold text-blue-600 hover:underline">Jump to Message</button>
                        <span className="text-gray-300 dark:text-slate-600">·</span>
                        <button onClick={() => onUnpin(message.id)} className="text-xs font-semibold text-red-500 hover:underline">Unpin</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


type PinnedMessagesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onUnpin: (messageId: string) => void;
  onJumpTo: (messageId: string) => void;
};

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({ isOpen, onClose, messages, onUnpin, onJumpTo }) => {
    const pinnedMessages = messages.filter(msg => msg.isPinned);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pinned-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                            <h2 id="pinned-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">Pinned Messages</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20" aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {pinnedMessages.length > 0 ? (
                                pinnedMessages.map(msg => (
                                    <PinnedMessageItem key={msg.id} message={msg} onJumpTo={onJumpTo} onUnpin={onUnpin} />
                                ))
                            ) : (
                                <p className="p-6 text-sm text-center text-gray-500 dark:text-slate-400">No messages have been pinned yet.</p>
                            )}
                        </div>
                        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Done</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};