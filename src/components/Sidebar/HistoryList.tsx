/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ChatSession } from '../../types';
import { HistoryItem } from './HistoryItem';

type HistoryListProps = {
  history: ChatSession[];
  currentChatId: string | null;
  searchQuery: string;
  isCollapsed: boolean;
  onNewChat: () => void;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
};

const groupChatsByMonth = (chats: ChatSession[]): { [key: string]: ChatSession[] } => {
    const groups: { [key: string]: ChatSession[] } = {};
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);

    sortedChats.forEach(chat => {
        const chatDate = new Date(chat.createdAt);
        let groupKey: string;

        if (chat.createdAt >= todayStart) {
            groupKey = 'Today';
        } else {
            groupKey = chatDate.toLocaleString('default', { month: 'long' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(chat);
    });
    return groups;
};

const NoResults = () => (
    <motion.div 
        className="text-xs text-slate-500 dark:text-slate-400 text-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <p className="font-medium">No conversations found</p>
    </motion.div>
);

export const HistoryList = ({ history, currentChatId, searchQuery, isCollapsed, onNewChat, onLoadChat, onDeleteChat }: HistoryListProps) => {
    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedHistory = groupChatsByMonth(filteredHistory);
    const groupOrder = ['Today', ...Object.keys(groupedHistory).filter(k => k !== 'Today').sort((a, b) => new Date(b) as any - (new Date(a) as any))];


    if (isCollapsed) return null;

    return (
        <div className="flex-1 overflow-y-auto min-h-0 text-sm">
            {Object.keys(groupedHistory).length > 0 ? (
                <div className="space-y-4">
                    {groupOrder.map(groupName => {
                        const chatsInGroup = groupedHistory[groupName];
                        if (!chatsInGroup || chatsInGroup.length === 0) return null;

                        return (
                            <div key={groupName}>
                                <h3 className="px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{groupName}</h3>
                                <div className="space-y-0.5">
                                    {groupName === 'Today' && (
                                        <button 
                                            onClick={onNewChat}
                                            className="w-full text-left px-2 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors"
                                        >
                                            New conversation
                                        </button>
                                    )}
                                    {chatsInGroup.map((item) => (
                                        <HistoryItem 
                                            key={item.id} 
                                            text={item.title} 
                                            isCollapsed={false} 
                                            searchQuery={searchQuery}
                                            active={item.id === currentChatId}
                                            onClick={() => onLoadChat(item.id)}
                                            onDelete={() => onDeleteChat(item.id)}
                                            isLoading={item.isLoading ?? false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    <button className="px-2 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors">
                        See all
                    </button>
                </div>
            ) : (
                <NoResults />
            )}
        </div>
    );
};
