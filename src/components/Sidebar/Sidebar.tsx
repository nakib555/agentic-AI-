/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

export const Sidebar = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    history, currentChatId, onNewChat, onLoadChat, onDeleteChat, onClearAllChats, theme, setTheme
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
    };

    const desktopVariants = {
        open: { width, translateX: '0%' },
        collapsed: { width: 80, translateX: '0%' },
    };
    
    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isDesktop ? (isCollapsed ? 'collapsed' : 'open') : (isOpen ? 'open' : 'closed');

    return (
        <motion.aside
            initial={isDesktop ? false : 'closed'}
            animate={animateState}
            variants={variants}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="bg-slate-100/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 p-4 flex-col flex fixed inset-y-0 left-0 z-20 w-72 max-w-[80vw] md:relative md:translate-x-0 md:shrink-0 md:w-auto group"
        >
            <div id="sidebar-content" className="flex flex-col h-full overflow-hidden">
                {/* Collapse Button for Desktop */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute top-5 -right-3 z-30 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </motion.div>
                </button>
                
                <SidebarHeader isCollapsed={isCollapsed} setIsOpen={setIsOpen} />

                <SearchInput 
                    isCollapsed={isCollapsed} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <nav className="flex flex-col gap-2">
                    <NavItem 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
                        text="New Chat"
                        active={!currentChatId}
                        isCollapsed={isCollapsed}
                        onClick={handleNewChat}
                    />
                    <NavItem 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                        text="History"
                        isCollapsed={isCollapsed}
                        onClick={() => {}}
                    />
                </nav>

                <HistoryList 
                    history={history}
                    currentChatId={currentChatId}
                    searchQuery={searchQuery}
                    isCollapsed={isCollapsed}
                    onLoadChat={onLoadChat}
                    onDeleteChat={onDeleteChat}
                />

                <SidebarFooter 
                    theme={theme}
                    setTheme={setTheme}
                    isCollapsed={isCollapsed}
                    onClearAllChats={onClearAllChats}
                />
            </div>

            {/* Resizing Handle */}
            <div
                onMouseDown={startResizing}
                className={`hidden ${isCollapsed ? '' : 'md:block'} absolute top-0 right-0 h-full w-2 cursor-col-resize`}
                role="separator"
                aria-label="Resize sidebar"
                aria-orientation="vertical"
                aria-controls="sidebar-content"
                aria-valuemin={240}
                aria-valuemax={500}
                aria-valuenow={width}
                tabIndex={0}
            >
                <div 
                    className={`h-full w-[1.5px] bg-slate-300 dark:bg-slate-600 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isResizing ? '!opacity-100 !bg-teal-500' : ''}`}
                ></div>
            </div>
        </motion.aside>
    );
};