/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TtsButton } from './TtsButton';
import type { Source } from '../../../types';
import { SourcesPills } from '../../AI/SourcesPills';

type MessageToolbarProps = {
    messageId: string;
    messageText: string;
    rawText: string;
    sources: Source[];
    ttsState: 'idle' | 'loading' | 'error' | 'playing';
    onTtsClick: () => void;
    onRegenerate: () => void;
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
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
    >
        {children}
    </button>
);


export const MessageToolbar: React.FC<MessageToolbarProps> = ({
    messageId, messageText, rawText, sources, ttsState, onTtsClick, onRegenerate
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

                <IconButton title="Regenerate response" onClick={onRegenerate}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="currentColor" className="w-4 h-4">
                        <path d="M 25 5 C 13.964844 5 5 13.964844 5 25 C 4.996094 25.359375 5.183594 25.695313 5.496094 25.878906 C 5.808594 26.058594 6.191406 26.058594 6.503906 25.878906 C 6.816406 25.695313 7.003906 25.359375 7 25 C 7 15.046875 15.046875 7 25 7 C 31.246094 7 36.726563 10.179688 39.957031 15 L 33 15 C 32.640625 14.996094 32.304688 15.183594 32.121094 15.496094 C 31.941406 15.808594 31.941406 16.191406 32.121094 16.503906 C 32.304688 16.816406 32.640625 17.003906 33 17 L 43 17 L 43 7 C 43.003906 6.730469 42.898438 6.46875 42.707031 6.277344 C 42.515625 6.085938 42.253906 5.980469 41.984375 5.984375 C 41.433594 5.996094 40.992188 6.449219 41 7 L 41 13.011719 C 37.347656 8.148438 31.539063 5 25 5 Z M 43.984375 23.984375 C 43.433594 23.996094 42.992188 24.449219 43 25 C 43 34.953125 34.953125 43 25 43 C 18.753906 43 13.269531 39.820313 10.042969 35 L 17 35 C 17.359375 35.007813 17.695313 34.816406 17.878906 34.507813 C 18.058594 34.195313 18.058594 33.808594 17.878906 33.496094 C 17.695313 33.1875 17.359375 32.996094 17 33 L 8.445313 33 C 8.316406 32.976563 8.1875 32.976563 8.058594 33 L 7 33 L 7 43 C 6.996094 43.359375 7.183594 43.695313 7.496094 43.878906 C 7.808594 44.058594 8.191406 44.058594 8.503906 43.878906 C 8.816406 43.695313 9.003906 43.359375 9 43 L 9 36.984375 C 12.648438 41.847656 18.460938 45 25 45 C 36.035156 45 45 36.035156 45 25 C 45.003906 24.730469 44.898438 24.46875 44.707031 24.277344 C 44.515625 24.085938 44.253906 23.980469 43.984375 23.984375 Z"></path>
                    </svg>
                </IconButton>

                <IconButton title="Share" onClick={handleShare}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5ZM12.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" /><path d="M15.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /><path d="M4.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /></svg>
                </IconButton>
            </div>

            <div className="flex-shrink-0">
                <SourcesPills sources={sources} />
            </div>
        </div>
    );
};