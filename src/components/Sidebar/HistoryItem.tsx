/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-teal-200/30 dark:bg-teal-500/30 font-semibold rounded-sm px-0.5">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

type HistoryItemProps = {
    text: string;
    isCollapsed: boolean;
    searchQuery: string;
    active: boolean;
    isLoading: boolean;
    onClick: () => void;
    onDelete: () => void;
};

export const HistoryItem: React.FC<HistoryItemProps> = ({ text, isCollapsed, searchQuery, active, isLoading, onClick, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the main onClick from firing
        onDelete();
    };

    return (
        <div className="relative group">
            <button 
                onClick={onClick} 
                className={`w-full text-sm p-2 rounded-lg text-left flex items-center gap-3 transition-colors ${active ? 'bg-black/10 text-slate-800 dark:bg-white/10 dark:text-slate-100' : 'text-slate-600 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''} ${!isCollapsed ? 'pr-8' : ''}`}
            >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {isLoading ? (
                         <div className="w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500 dark:text-slate-400"><path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.445 6.445 0 0 1 4.271 0l.415.083a.75.75 0 0 0 .433-.69V8.69a.75.75 0 0 0-.433-.69l-.415-.083a6.446 6.446 0 0 1-4.271 0L3.5 7.568V2.75Z" /></svg>
                    )}
                </div>
                <motion.span 
                    className="whitespace-nowrap overflow-hidden flex-1"
                    initial={false}
                    animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                     <Highlight text={text} highlight={searchQuery} />
                </motion.span>
            </button>
            {!isCollapsed && (
                <button
                    onClick={handleDelete}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:bg-slate-300/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600/60 dark:hover:text-slate-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    aria-label={`Delete chat: ${text}`}
                    title={`Delete chat: ${text}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" /></svg>
                </button>
            )}
             {isCollapsed && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    <Highlight text={text} highlight={searchQuery} />
                </div>
            )}
        </div>
    );
};