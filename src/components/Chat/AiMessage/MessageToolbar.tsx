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
            ? 'bg-primary/10 text-primary-focus'
            : 'text-text-muted hover:bg-ui-200'
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
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.121A1.5 1.5 0 0 1 17 6.621V16.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 16.5v-13Z" /><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4h1V3a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 0 4 3.5v11A1.5 1.5 0 0 0 5.5 16h1V6.5A1.5 1.5 0 0 1 8 5h1V4H6.5A1.5 1.5 0 0 1 5 5.5Z" /></svg>
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
                
                <div className="h-4 w-px bg-border-color mx-1"></div>

                <TtsButton isPlaying={ttsState === 'playing'} isLoading={ttsState === 'loading'} onClick={onTtsClick} />

                <IconButton title="Regenerate response" onClick={onRegenerate}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.32 2.366l-1.12 1.12A.75.75 0 0 1 3.75 14V11.25a.75.75 0 0 1 .75-.75h2.75a.75.75 0 0 1 .53 1.28l-1.12 1.12a4 4 0 0 0 6.788-1.72.75.75 0 0 1 1.392.574ZM4.688 8.576a5.5 5.5 0 0 1 9.32-2.366l1.12-1.12A.75.75 0 0 1 16.25 6H13.5a.75.75 0 0 1-.75-.75V2.5a.75.75 0 0 1 1.28-.53l1.12 1.12a4 4 0 0 0-6.788 1.72.75.75 0 0 1-1.392-.574Z" clipRule="evenodd" /></svg>
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