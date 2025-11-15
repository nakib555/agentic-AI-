/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TtsButton } from './TtsButton';
import type { Source } from '../../../types';
import { SourcesPills } from '../../AI/SourcesPills';
import { ResponsePaginator } from './ResponsePaginator';

type MessageToolbarProps = {
    messageId: string;
    messageText: string;
    rawText: string;
    sources: Source[];
    ttsState: 'idle' | 'loading' | 'error' | 'playing';
    onTtsClick: () => void;
    onRegenerate: () => void;
    responseCount: number;
    activeResponseIndex: number;
    onResponseChange: (index: number) => void;
};

type FeedbackState = 'up' | 'down' | null;

const IconButton: React.FC<{
    title: string;
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    active?: boolean;
}> = ({ title, onClick, disabled, children, active }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            active
            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
            : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:text-white dark:hover:bg-slate-800'
        }`}
    >
        {children}
    </button>
);


export const MessageToolbar: React.FC<MessageToolbarProps> = ({
    messageText, sources, ttsState, onTtsClick, onRegenerate,
    responseCount, activeResponseIndex, onResponseChange,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(messageText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleShare = () => {
        navigator.clipboard.writeText(messageText).then(() => {
            alert('Message content copied to clipboard.');
        });
    };

    return (
        <div className="w-full flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
                <IconButton title={isCopied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
                    <AnimatePresence mode="wait" initial={false}>
                        {isCopied ? (
                            <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="w-4 h-4 text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                            </motion.div>
                        ) : (
                            <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="w-4 h-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </IconButton>

                <IconButton title="Good response" onClick={() => setFeedback('up')} active={feedback === 'up'}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M1 9.5a1.5 1.5 0 0 1 1.5-1.5h1.372a3.5 3.5 0 0 0 3.09-5.262L6.386 1.48a.75.75 0 0 1 1.228-.624l1.323.827a4.5 4.5 0 0 1 4.706 0l1.323-.827a.75.75 0 0 1 1.228.624l-.576 1.256A3.5 3.5 0 0 0 16.128 8H17.5A1.5 1.5 0 0 1 19 9.5v1.042a3.5 3.5 0 0 0-3.32-.888l-1.928.514a.75.75 0 0 1-.86-.43l-.7-1.75a.75.75 0 0 0-1.384 0l-.7 1.75a.75.75 0 0 1-.86.43l-1.928-.514A3.5 3.5 0 0 0 1 10.542V9.5Z" /></svg>
                </IconButton>

                <IconButton title="Bad response" onClick={() => setFeedback('down')} active={feedback === 'down'}>
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M19 10.5a1.5 1.5 0 0 1-1.5 1.5h-1.372a3.5 3.5 0 0 0-3.09 5.262l.576 1.256a.75.75 0 0 1-1.228.624l-1.323-.827a4.5 4.5 0 0 1-4.706 0l-1.323.827a.75.75 0 0 1-1.228-.624l.576-1.256A3.5 3.5 0 0 0 3.872 12H2.5A1.5 1.5 0 0 1 1 10.5v-1.042a3.5 3.5 0 0 0 3.32.888l1.928-.514a.75.75 0 0 1 .86.43l.7 1.75a.75.75 0 0 0 1.384 0l.7-1.75a.75.75 0 0 1 .86-.43l1.928.514A3.5 3.5 0 0 0 19 9.458v1.042Z" /></svg>
                </IconButton>
                
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <TtsButton isPlaying={ttsState === 'playing'} isLoading={ttsState === 'loading'} onClick={onTtsClick} />
                
                <IconButton title="Share" onClick={handleShare}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5ZM12.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" /><path d="M15.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /><path d="M4.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /></svg>
                </IconButton>
            </div>

            <div className="flex items-center gap-4">
                <ResponsePaginator
                    count={responseCount}
                    activeIndex={activeResponseIndex}
                    onChange={onResponseChange}
                />
                <IconButton title="Regenerate response" onClick={onRegenerate}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="currentColor" className="w-5 h-5">
                        <path d="M 15 3 C 12.031398 3 9.3028202 4.0834384 7.2070312 5.875 A 1.0001 1.0001 0 1 0 8.5058594 7.3945312 C 10.25407 5.9000929 12.516602 5 15 5 C 20.19656 5 24.450989 8.9379267 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.437925 7.8516588 21.277839 3 15 3 z M 4 10 L 0 16 L 3.0507812 16 C 3.562075 22.148341 8.7221607 27 15 27 C 17.968602 27 20.69718 25.916562 22.792969 24.125 A 1.0001 1.0001 0 1 0 21.494141 22.605469 C 19.74593 24.099907 17.483398 25 15 25 C 9.80344 25 5.5490109 21.062074 5.0488281 16 L 8 16 L 4 10 z"></path>
                    </svg>
                </IconButton>
                <div className="flex-shrink-0">
                    <SourcesPills sources={sources} />
                </div>
            </div>
        </div>
    );
};