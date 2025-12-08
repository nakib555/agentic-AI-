
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef, CSSProperties, memo } from 'react';
import { VariableSizeList as List, areEqual } from 'react-window';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import type { ChatSession } from '../../types';
import { HistoryItem } from './HistoryItem';

type HistoryListProps = {
  history: ChatSession[];
  currentChatId: string | null;
  searchQuery: string;
  isCollapsed: boolean;
  isDesktop: boolean;
  isHistoryLoading: boolean;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onUpdateChatTitle: (id: string, title: string) => void;
};

// Flattened Item Types for Virtualization
type HeaderItem = { type: 'header'; name: string; collapsed: boolean };
type ChatItem = { type: 'chat'; chat: ChatSession };
type ListItem = HeaderItem | ChatItem;

const groupChatsByDate = (chats: ChatSession[]): { [key: string]: ChatSession[] } => {
    const groups: { [key: string]: ChatSession[] } = {};
    const now = new Date();
    
    // Normalize to start of day for comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - (86400000 * 7);
    const thirtyDaysStart = todayStart - (86400000 * 30);

    chats.forEach(chat => {
        const chatTime = chat.createdAt;
        let groupKey: string;

        if (chatTime >= todayStart) {
            groupKey = 'Today';
        } else if (chatTime >= yesterdayStart) {
            groupKey = 'Yesterday';
        } else if (chatTime >= weekStart) {
            groupKey = 'Previous 7 Days';
        } else if (chatTime >= thirtyDaysStart) {
            groupKey = 'Previous 30 Days';
        } else {
            const date = new Date(chatTime);
            groupKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(chat);
    });
    return groups;
};

const NoItems = ({ message }: { message: string }) => (
    <motion.div 
        className="text-sm text-slate-500 dark:text-slate-400 text-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <p className="font-medium">{message}</p>
    </motion.div>
);

const HistorySkeleton = () => (
    <div className="space-y-1 animate-pulse px-2">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 w-full bg-gray-100/60 dark:bg-violet-900/30 rounded-lg"></div>
        ))}
    </div>
);

const ChevronIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform">
        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

// Helper hook to get dimensions of the container for virtual list
const useResizeObserver = (ref: React.RefObject<HTMLElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, [ref]);
  return dimensions;
};

// Data interface for the Item Renderer
type ListData = {
    items: ListItem[];
    currentChatId: string | null;
    searchQuery: string;
    isCollapsed: boolean;
    isDesktop: boolean;
    toggleGroup: (groupName: string) => void;
    onLoadChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onUpdateChatTitle: (id: string, newTitle: string) => void;
};

// Optimized Row Component
const HistoryRow = memo(({ index, style, data }: { index: number; style: CSSProperties; data: ListData }) => {
    const { items, currentChatId, searchQuery, isCollapsed, isDesktop, toggleGroup, onLoadChat, onDeleteChat, onUpdateChatTitle } = data;
    const item = items[index];
    const shouldCollapse = isDesktop && isCollapsed;

    if (item.type === 'header') {
        return (
            <div style={style} className="px-2">
                <button
                    onClick={() => !shouldCollapse && toggleGroup(item.name)}
                    disabled={shouldCollapse}
                    className="w-full flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-gray-100/60 dark:hover:bg-violet-900/30 rounded py-2 transition-colors disabled:cursor-default disabled:bg-transparent"
                >
                    <span className="block overflow-hidden whitespace-nowrap text-left truncate">
                        {shouldCollapse ? '' : item.name}
                    </span>
                    {!shouldCollapse && (
                        <div
                            style={{ transform: item.collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}
                        >
                            <ChevronIcon />
                        </div>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div style={style} className="px-2">
            <HistoryItem 
                text={item.chat.title} 
                isCollapsed={isCollapsed}
                isDesktop={isDesktop}
                searchQuery={searchQuery}
                active={item.chat.id === currentChatId}
                onClick={() => onLoadChat(item.chat.id)}
                onDelete={() => onDeleteChat(item.chat.id)}
                onUpdateTitle={(newTitle) => onUpdateChatTitle(item.chat.id, newTitle)}
                isLoading={item.chat.isLoading ?? false}
            />
        </div>
    );
}, areEqual);

export const HistoryList = ({ history, currentChatId, searchQuery, isCollapsed, isDesktop, isHistoryLoading, onLoadChat, onDeleteChat, onUpdateChatTitle }: HistoryListProps) => {
    const shouldCollapse = isDesktop && isCollapsed;
    const containerRef = useRef<HTMLDivElement>(null);
    const { width, height } = useResizeObserver(containerRef);
    const listRef = useRef<List>(null);

    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
        try {
            const savedState = localStorage.getItem('chatHistoryGroups');
            return savedState ? JSON.parse(savedState) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('chatHistoryGroups', JSON.stringify(collapsedGroups));
        // Reset list cache when group collapse state changes
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [collapsedGroups]);

    // Derived State: Flattened list for virtualization
    const flattenedData = useMemo(() => {
        const filteredHistory = history.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // If searching, we flatten everything without headers to show matches directly
        if (searchQuery) {
             const items: ListItem[] = [];
             [...filteredHistory].sort((a, b) => b.createdAt - a.createdAt).forEach(chat => items.push({ type: 'chat', chat }));
             return items;
        }

        const groupedHistory = groupChatsByDate(filteredHistory);
        
        const fixedGroups = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days'];
        const monthGroups = Object.keys(groupedHistory)
            .filter(k => !fixedGroups.includes(k))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        const groupOrder = [...fixedGroups, ...monthGroups];
        
        const items: ListItem[] = [];

        groupOrder.forEach(groupName => {
            const chats = groupedHistory[groupName];
            if (!chats || chats.length === 0) return;

            // Sort chats within the group by most recent first
            chats.sort((a, b) => b.createdAt - a.createdAt);

            const isGroupCollapsed = collapsedGroups[groupName] ?? false;
            items.push({ type: 'header', name: groupName, collapsed: isGroupCollapsed });

            if (!isGroupCollapsed) {
                chats.forEach(chat => {
                    items.push({ type: 'chat', chat });
                });
            }
        });

        return items;
    }, [history, searchQuery, collapsedGroups]);

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    // Construct the data object for the list
    const itemData = useMemo(() => ({
        items: flattenedData,
        currentChatId,
        searchQuery,
        isCollapsed,
        isDesktop,
        toggleGroup,
        onLoadChat,
        onDeleteChat,
        onUpdateChatTitle
    }), [flattenedData, currentChatId, searchQuery, isCollapsed, isDesktop, toggleGroup, onLoadChat, onDeleteChat, onUpdateChatTitle]);

    // Calculate dynamic height based on item type
    const getItemSize = (index: number) => {
        const item = flattenedData[index];
        if (item.type === 'header') return 32; // Header height
        return 36; // Chat item height (approx 2rem + padding)
    };

    if (isHistoryLoading) {
        return (
            <div className={`flex-1 min-h-0 text-sm`}>
                <HistorySkeleton />
            </div>
        );
    }

    if (flattenedData.length === 0) {
        return (
            <div className={`flex-1 min-h-0 text-sm`}>
                {!shouldCollapse && <NoItems message={searchQuery ? 'No conversations found' : 'No conversations yet'} />}
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 text-sm w-full" ref={containerRef}>
            {height > 0 && (
                <List
                    ref={listRef}
                    height={height}
                    itemCount={flattenedData.length}
                    itemSize={getItemSize}
                    width={width}
                    itemData={itemData}
                    className="custom-scrollbar"
                >
                    {HistoryRow}
                </List>
            )}
        </div>
    );
};
