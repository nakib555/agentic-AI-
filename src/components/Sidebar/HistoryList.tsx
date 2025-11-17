/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import type { ChatSession } from '../../types';
import { HistoryItem } from './HistoryItem';

type HistoryListProps = {
  history: ChatSession[];
  currentChatId: string | null;
  searchQuery: string;
  isCollapsed: boolean;
  isDesktop: boolean;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onUpdateChatTitle: (id: string, title: string) => void;
};

const groupChatsByMonth = (chats: ChatSession[]): { [key: string]: ChatSession[] } => {
    const groups: { [key: string]: ChatSession[] } = {};
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    // The `history` prop is already sorted newest to oldest from the parent hook.
    // Iterating and pushing will maintain this order within groups.
    chats.forEach(chat => {
        const chatDate = new Date(chat.createdAt);
        let groupKey: string;

        if (chat.createdAt >= todayStart) {
            groupKey = 'Today';
        } else if (chat.createdAt >= yesterdayStart) {
            groupKey = 'Yesterday';
        } else {
            groupKey = chatDate.toLocaleString('default', { month: 'long', year: 'numeric' });
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
        className="text-sm text-slate-500 dark:text-slate-400 text-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <p className="font-medium">No conversations found</p>
    </motion.div>
);

export const HistoryList = ({ history, currentChatId, searchQuery, isCollapsed, isDesktop, onLoadChat, onDeleteChat, onUpdateChatTitle }: HistoryListProps) => {
    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedHistory = groupChatsByMonth(filteredHistory);
    // Establish a chronological sort order for the group titles.
    const groupOrder = ['Today', 'Yesterday', ...Object.keys(groupedHistory).filter(k => k !== 'Today' && k !== 'Yesterday').sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];
    
    const shouldCollapse = isDesktop && isCollapsed;

    return (
        <div className={`flex-1 min-h-0 text-sm ${!shouldCollapse ? 'overflow-y-auto' : ''}`}>
            {Object.keys(groupedHistory).length > 0 ? (
                <div className="space-y-4">
                    {groupOrder.map(groupName => {
                        const chatsInGroup = groupedHistory[groupName];
                        if (!chatsInGroup || chatsInGroup.length === 0) return null;

                        return (
                            <div key={groupName}>
                                <h3 
                                    className="px-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                                >
                                    <motion.span
                                        className="block overflow-hidden whitespace-nowrap"
                                        initial={false}
                                        animate={{ width: shouldCollapse ? 0 : 'auto', opacity: shouldCollapse ? 0 : 1, x: shouldCollapse ? -5 : 0 }}
                                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        {groupName}
                                    </motion.span>
                                </h3>
                                <div className="space-y-0.5">
                                    {chatsInGroup.map((item) => (
                                        <HistoryItem 
                                            key={item.id} 
                                            text={item.title} 
                                            isCollapsed={isCollapsed}
                                            isDesktop={isDesktop}
                                            searchQuery={searchQuery}
                                            active={item.id === currentChatId}
                                            onClick={() => onLoadChat(item.id)}
                                            onDelete={() => onDeleteChat(item.id)}
                                            onUpdateTitle={(newTitle) => onUpdateChatTitle(item.id, newTitle)}
                                            isLoading={item.isLoading ?? false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                !shouldCollapse && <NoResults />
            )}
        </div>
    );
};