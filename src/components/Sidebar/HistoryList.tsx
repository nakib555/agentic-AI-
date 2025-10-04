/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatSession } from '../../types';
import { HistoryItem } from './HistoryItem';

type HistoryListProps = {
  history: ChatSession[];
  currentChatId: string | null;
  searchQuery: string;
  isCollapsed: boolean;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
};

const NoResults = () => (
    <motion.div 
        className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
        <p className="font-medium">No results found</p>
        <p className="text-xs">Try a different search term.</p>
    </motion.div>
);

const NoHistory = () => (
    <motion.div 
        className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
        <p className="font-medium">No history yet</p>
        <p className="text-xs">Start a new chat to begin.</p>
    </motion.div>
);

export const HistoryList = ({ history, currentChatId, searchQuery, isCollapsed, onLoadChat, onDeleteChat }: HistoryListProps) => {
    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 flex-1 overflow-y-auto min-h-0">
            <div className="space-y-1">
                {history.length > 0 ? (
                    filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                            <HistoryItem 
                                key={item.id} 
                                text={item.title} 
                                isCollapsed={isCollapsed} 
                                searchQuery={searchQuery}
                                active={item.id === currentChatId}
                                onClick={() => onLoadChat(item.id)}
                                onDelete={() => onDeleteChat(item.id)}
                                isLoading={item.isLoading ?? false}
                            />
                        ))
                    ) : (
                        <AnimatePresence>
                            {!isCollapsed && <NoResults />}
                        </AnimatePresence>
                    )
                ) : (
                    <AnimatePresence>
                        {!isCollapsed && <NoHistory />}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};