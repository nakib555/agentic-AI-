/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavItem } from './NavItem';
import type { ChatSession } from '../../../types';
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
    onSettingsClick: () => void;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

export const Sidebar = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    history, currentChatId, onNewChat, onLoadChat, onDeleteChat, onClearAllChats, 
    theme, setTheme, onSettingsClick
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
        collapsed: { width: 80, translateX: '0%' },
    };
    
    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isDesktop ? (isCollapsed ? 'collapsed' : 'open') : (isOpen ? 'open' : 'closed');

    return (
        <>
            <motion.aside
                initial={isDesktop ? false : 'closed'}
                animate={animateState}
                variants={variants}
                transition={{ type: 'tween', duration: 0.4, ease: 'easeInOut' }}
                className="bg-gray-100/80 dark:bg-black/20 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 p-4 flex-col flex fixed inset-y-0 left-0 z-20 w-80 max-w-[80vw] md:relative md:translate-x-0 md:shrink-0 group"
            >
                <div id="sidebar-content" className="flex flex-col h-full overflow-hidden">
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
    
                    <div className="flex-1 flex flex-col min-h-0 mt-4">
                        <HistoryList 
                            history={history}
                            currentChatId={currentChatId}
                            searchQuery={searchQuery}
                            isCollapsed={isCollapsed}
                            onLoadChat={handleLoadChat}
                            onDeleteChat={onDeleteChat}
                        />
                    </div>
                    
                    <SidebarFooter 
                        theme={theme}
                        setTheme={setTheme}
                        isCollapsed={isCollapsed}
                        onClearAllChats={onClearAllChats}
                        onSettingsClick={onSettingsClick}
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
                        className={`h-full w-px bg-gray-300 dark:bg-white/10 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isResizing ? '!opacity-100 !bg-blue-500' : ''}`}
                    ></div>
                </div>
    
            </motion.aside>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 z-10 md:hidden"
                    role="button"
                    aria-label="Close sidebar"
                    tabIndex={0}
                  />
                )}
            </AnimatePresence>
        </>
    );
};