/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { NavItem } from './NavItem';
import { HistoryItem } from './HistoryItem';
import { ThemeToggle } from './ThemeToggle';
import type { ChatSession } from '../../types';
import type { Theme } from '../../hooks/useTheme';

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

const searchContainerVariants: Variants = {
    open: {
        height: 'auto',
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
    },
    collapsed: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
    }
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

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            {/* Collapse Button for Desktop */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex absolute top-5 -right-3 z-30 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </motion.div>
            </button>
            
            <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600 flex-shrink-0">
                        <path d="M12 4C13.1046 4 14 4.89543 14 6V7.67451C15.8457 8.21661 17.2166 9.58752 17.7587 11.4332H19.4332C20.5378 11.4332 21.4332 12.3287 21.4332 13.4332C21.4332 14.5378 20.5378 15.4332 19.4332 15.4332H17.7587C17.2166 17.2789 15.8457 18.6498 14 19.1919V20.8665C14 21.9711 13.1046 22.8665 12 22.8665C10.8954 22.8665 10 21.9711 10 20.8665V19.1919C8.15432 18.6498 6.7834 17.2789 6.24131 15.4332H4.56681C3.46224 15.4332 2.56681 14.5378 2.56681 13.4332C2.56681 12.3287 3.46224 11.4332 4.56681 11.4332H6.24131C6.7834 9.58752 8.15432 8.21661 10 7.67451V6C10 4.89543 10.8954 4 12 4ZM12 9.14155C9.88142 9.14155 8.14155 10.8814 8.14155 13C8.14155 15.1186 9.88142 16.8584 12 16.8584C14.1186 16.8584 15.8584 15.1186 15.8584 13C15.8584 10.8814 14.1186 9.14155 12 9.14155Z" fill="currentColor"/>
                    </svg>
                    <motion.span 
                        className="text-2xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap"
                        initial={false}
                        animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        Gemini
                    </motion.span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                    aria-label="Close sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <motion.div 
                className="relative mb-6 overflow-hidden"
                initial={false}
                variants={searchContainerVariants}
                animate={isCollapsed ? 'collapsed' : 'open'}
            >
                 <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
                 </div>
            </motion.div>

            <nav className="flex flex-col gap-2">
                <NavItem 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
                    text="New Chat"
                    active={!currentChatId}
                    isCollapsed={isCollapsed}
                    onClick={onNewChat}
                />
                 <NavItem 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                    text="History"
                    isCollapsed={isCollapsed}
                    onClick={() => {}}
                />
            </nav>

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
                                {!isCollapsed && (
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
                                )}
                            </AnimatePresence>
                        )
                    ) : (
                        <AnimatePresence>
                             {!isCollapsed && (
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
                             )}
                        </AnimatePresence>
                    )}
                 </div>
            </div>

            <div className="mt-auto pt-4 space-y-2">
                <NavItem 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>}
                    text="Clear conversations"
                    isCollapsed={isCollapsed}
                    onClick={onClearAllChats}
                />
                 <ThemeToggle theme={theme} setTheme={setTheme} isCollapsed={isCollapsed} />
            </div>

            {/* Resizing Handle */}
            <div
                onMouseDown={startResizing}
                className={`hidden ${isCollapsed ? '' : 'md:block'} absolute top-0 right-0 h-full w-2 cursor-col-resize`}
            >
                <div 
                    className={`h-full w-[1.5px] bg-slate-300 dark:bg-slate-600 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isResizing ? '!opacity-100 !bg-purple-500' : ''}`}
                ></div>
            </div>
        </motion.aside>
    );
};
