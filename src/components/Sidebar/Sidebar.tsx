/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { NavItem } from './NavItem';
import type { ChatSession } from '../../types';
import type { Theme } from '../../hooks/useTheme';
import { SidebarHeader } from './SidebarHeader';
import { SearchInput } from './SearchInput';
import { HistoryList } from './HistoryList';
import { SidebarFooter } from './SidebarFooter';

type SidebarProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    width: number;
    setWidth: (width: number) => void;
    history: ChatSession[];
    currentChatId: string | null;
    onNewChat: () => void;
    onLoadChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onClearAllChats: () => void;
    onUpdateChatTitle: (id: string, title: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onSettingsClick: () => void;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

export const Sidebar = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    history, currentChatId, onNewChat, onLoadChat, onDeleteChat, onClearAllChats, 
    onUpdateChatTitle, theme, setTheme, onSettingsClick
}: SidebarProps) => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [isResizing, setIsResizing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            setWidth(e.clientX);
        }
    }, [isResizing, setWidth]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const handleNewChat = () => {
        onNewChat();
        setSearchQuery('');
        if (!isDesktop) {
            setIsOpen(false);
        }
    };

    const handleLoadChat = (id: string) => {
        onLoadChat(id);
        if (!isDesktop) {
            setIsOpen(false);
        }
    };

    const desktopVariants = {
        open: { width, translateX: '0%' },
        collapsed: { width: 72, translateX: '0%' },
    };
    
    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isDesktop ? (isCollapsed ? 'collapsed' : 'open') : (isOpen ? 'open' : 'closed');

    // This effect handles keyboard shortcuts for search.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                // If the sidebar is collapsed, we need to expand it to show the search bar.
                if (isCollapsed) {
                    setIsCollapsed(false);
                }
                // We'll also ensure the sidebar is open on mobile.
                if (!isOpen && !isDesktop) {
                    setIsOpen(true);
                }
                // The search input itself will be focused by its own logic,
                // but we need to ensure it's visible first.
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCollapsed, isDesktop, isOpen, setIsCollapsed, setIsOpen]);


    return (
        <aside className="h-full flex-shrink-0 z-20">
            {/* Overlay for mobile */}
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-10" 
                    />
                )}
            </AnimatePresence>
            
            <motion.div
                layout="position"
                initial={false}
                animate={animateState}
                variants={variants}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                style={{
                    height: '100%',
                    position: isDesktop ? 'relative' : 'fixed',
                    left: 0,
                    top: 0,
                }}
                className="bg-gray-100 dark:bg-[#1e1e1e] border-r border-black/10 dark:border-white/10 flex flex-col"
            >
                <div 
                    className="p-3 flex flex-col h-full overflow-hidden"
                    style={{
                        userSelect: isResizing ? 'none' : 'auto',
                    }}
                >
                    <SidebarHeader 
                        isCollapsed={isCollapsed} 
                        setIsOpen={setIsOpen} 
                        onNewChat={handleNewChat}
                    />

                    <SearchInput 
                        isCollapsed={isCollapsed}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                    
                    <motion.div 
                        className="my-4 border-t border-black/10 dark:border-white/10"
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : 'auto' }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    />

                    <HistoryList 
                        history={history}
                        currentChatId={currentChatId}
                        searchQuery={searchQuery}
                        isCollapsed={isCollapsed}
                        onLoadChat={handleLoadChat}
                        onDeleteChat={onDeleteChat}
                        onUpdateChatTitle={onUpdateChatTitle}
                    />
                    
                    <SidebarFooter 
                        theme={theme}
                        setTheme={setTheme}
                        isCollapsed={isCollapsed}
                        onClearAllChats={onClearAllChats}
                        onSettingsClick={onSettingsClick}
                    />
                </div>

                {isDesktop && !isCollapsed && (
                    <div
                        onMouseDown={startResizing}
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors"
                        title="Resize sidebar"
                    />
                )}
            </motion.div>
        </aside>
    );
};