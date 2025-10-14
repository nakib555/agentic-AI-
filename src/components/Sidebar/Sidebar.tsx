/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [activeNav, setActiveNav] = useState('Chat'); // Default active item based on screenshot
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);

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
        setActiveNav('Chat');
        setSearchQuery('');
    };
    
    // When a chat is loaded from history, set "Chat" as active
    useEffect(() => {
        if (currentChatId) {
            setActiveNav('Chat');
        }
    }, [currentChatId]);


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
            className="bg-slate-100/80 dark:bg-black/80 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 p-4 flex-col flex fixed inset-y-0 left-0 z-20 w-72 max-w-[80vw] md:relative md:translate-x-0 md:shrink-0 md:w-auto group"
        >
            <div id="sidebar-content" className="flex flex-col h-full overflow-hidden">
                <SidebarHeader isCollapsed={isCollapsed} setIsOpen={setIsOpen} />
                
                <SearchInput 
                    isCollapsed={isCollapsed} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <nav className="flex flex-col gap-1 my-2">
                    <NavItem 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m13.483 5.665 2.858-2.858a.75.75 0 0 0-1.06-1.06L12.425 4.603 9.25 1.428a.75.75 0 0 0-1.06 1.061l3.176 3.176-3.023 3.023a.75.75 0 0 0 0 1.06l1.272 1.273a.75.75 0 0 0 1.06 0l9.43-9.431a.75.75 0 0 0 0-1.06l-2.857-2.858-2.857 2.857Zm-3.02 9.311 3.176-3.176a.75.75 0 0 0-1.06-1.06l-3.176 3.176-2.857-2.857a.75.75 0 0 0-1.06 1.06L7.34 15.19l-2.52 2.52a.75.75 0 0 0 1.06 1.06l2.52-2.52 1.273 1.273a.75.75 0 0 0 1.06 0Z" /></svg>}
                        text="Chat"
                        active={activeNav === 'Chat'}
                        isCollapsed={isCollapsed}
                        onClick={handleNewChat}
                    />
                </nav>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                            className="flex flex-col flex-1 min-h-0"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto', transition: { delay: 0.1 } }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="my-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <NavItem 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                                    text="History"
                                    active={isHistoryVisible}
                                    isCollapsed={isCollapsed}
                                    onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                />
                            </div>
                            <AnimatePresence>
                                {isHistoryVisible && (
                                     <motion.div
                                        className="flex flex-col flex-1 min-h-0"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                     >
                                        <HistoryList 
                                            history={history}
                                            currentChatId={currentChatId}
                                            searchQuery={searchQuery}
                                            isCollapsed={isCollapsed}
                                            onLoadChat={onLoadChat}
                                            onDeleteChat={onDeleteChat}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
                

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
        </motion.aside>
    );
};