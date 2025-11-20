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
    onShowSources: (sources: Source[]) => void;
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
    messageText, sources, onShowSources, ttsState, onTtsClick, onRegenerate,
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
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M15.1883 5.10908C15.3699 4.96398 15.6346 4.96153 15.8202 5.11592C16.0056 5.27067 16.0504 5.53125 15.9403 5.73605L15.8836 5.82003L8.38354 14.8202C8.29361 14.9279 8.16242 14.9925 8.02221 14.9989C7.88203 15.0051 7.74545 14.9526 7.64622 14.8534L4.14617 11.3533L4.08172 11.2752C3.95384 11.0811 3.97542 10.817 4.14617 10.6463C4.31693 10.4755 4.58105 10.4539 4.77509 10.5818L4.85321 10.6463L7.96556 13.7586L15.1161 5.1794L15.1883 5.10908Z"></path></svg>
                            </motion.div>
                        ) : (
                            <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="w-4 h-4">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M10 1.5C11.1097 1.5 12.0758 2.10424 12.5947 3H14.5C15.3284 3 16 3.67157 16 4.5V16.5C16 17.3284 15.3284 18 14.5 18H5.5C4.67157 18 4 17.3284 4 16.5V4.5C4 3.67157 4.67157 3 5.5 3H7.40527C7.92423 2.10424 8.89028 1.5 10 1.5ZM5.5 4C5.22386 4 5 4.22386 5 4.5V16.5C5 16.7761 5.22386 17 5.5 17H14.5C14.7761 17 15 16.7761 15 16.5V4.5C15 4.22386 14.7761 4 14.5 4H12.958C12.9853 4.16263 13 4.32961 13 4.5V5.5C13 5.77614 12.7761 6 12.5 6H7.5C7.22386 6 7 5.77614 7 5.5V4.5C7 4.32961 7.0147 4.16263 7.04199 4H5.5ZM12.54 13.3037C12.6486 13.05 12.9425 12.9317 13.1963 13.04C13.45 13.1486 13.5683 13.4425 13.46 13.6963C13.1651 14.3853 12.589 15 11.7998 15C11.3132 14.9999 10.908 14.7663 10.5996 14.4258C10.2913 14.7661 9.88667 14.9999 9.40039 15C8.91365 15 8.50769 14.7665 8.19922 14.4258C7.89083 14.7661 7.48636 15 7 15C6.72386 15 6.5 14.7761 6.5 14.5C6.5 14.2239 6.72386 14 7 14C7.21245 14 7.51918 13.8199 7.74023 13.3037L7.77441 13.2373C7.86451 13.0913 8.02513 13 8.2002 13C8.40022 13.0001 8.58145 13.1198 8.66016 13.3037C8.88121 13.8198 9.18796 14 9.40039 14C9.61284 13.9998 9.9197 13.8197 10.1406 13.3037L10.1748 13.2373C10.2649 13.0915 10.4248 13.0001 10.5996 13C10.7997 13 10.9808 13.1198 11.0596 13.3037C11.2806 13.8198 11.5874 13.9999 11.7998 14C12.0122 14 12.319 13.8198 12.54 13.3037ZM12.54 9.30371C12.6486 9.05001 12.9425 8.93174 13.1963 9.04004C13.45 9.14863 13.5683 9.44253 13.46 9.69629C13.1651 10.3853 12.589 11 11.7998 11C11.3132 10.9999 10.908 10.7663 10.5996 10.4258C10.2913 10.7661 9.88667 10.9999 9.40039 11C8.91365 11 8.50769 10.7665 8.19922 10.4258C7.89083 10.7661 7.48636 11 7 11C6.72386 11 6.5 10.7761 6.5 10.5C6.5 10.2239 6.72386 10 7 10C7.21245 10 7.51918 9.8199 7.74023 9.30371L7.77441 9.2373C7.86451 9.09126 8.02513 9 8.2002 9C8.40022 9.00008 8.58145 9.11981 8.66016 9.30371C8.88121 9.8198 9.18796 10 9.40039 10C9.61284 9.99978 9.9197 9.81969 10.1406 9.30371L10.1748 9.2373C10.2649 9.09147 10.4248 9.00014 10.5996 9C10.7997 9 10.9808 9.11975 11.0596 9.30371C11.2806 9.8198 11.5874 9.99989 11.7998 10C12.0122 10 12.319 9.81985 12.54 9.30371ZM10 2.5C8.89543 2.5 8 3.39543 8 4.5V5H12V4.5C12 3.39543 11.1046 2.5 10 2.5Z"></path></svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5ZM12.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" /><path d="M15.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /><path d="M4.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /></svg>
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
                    <SourcesPills sources={sources} onShowSources={() => onShowSources(sources)} />
                </div>
            </div>
        </div>
    );
};