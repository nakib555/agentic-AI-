
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
    history: ChatSession[];
    isHistoryLoading: boolean;
    currentChatId: string | null;
    onNewChat: () => void;
    onLoadChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onClearAllChats: () => void;
    onUpdateChatTitle: (id: string, title: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onSettingsClick: () => void;
    isDesktop: boolean;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    isResizing, setIsResizing, history, isHistoryLoading, currentChatId, onNewChat, onLoadChat,
    onDeleteChat, onClearAllChats, onUpdateChatTitle, theme, setTheme, onSettingsClick,
    isDesktop
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const prevIsDesktop = useRef(isDesktop);
    const [animationDisabledForResize, setAnimationDisabledForResize] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (prevIsDesktop.current !== isDesktop) {
            setAnimationDisabledForResize(true);
            const timer = setTimeout(() => {
                setAnimationDisabledForResize(false);
            }, 50);
            prevIsDesktop.current = isDesktop;
            return () => clearTimeout(timer);
        }
    }, [isDesktop]);

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);

        const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
            setWidth(mouseMoveEvent.clientX);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [setWidth, setIsResizing]);

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
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                if (isCollapsed) setIsCollapsed(false);
                if (!isOpen && !isDesktop) setIsOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCollapsed, isDesktop, isOpen, setIsCollapsed, setIsOpen]);


    return (
        <aside className={`h-full z-20 ${isDesktop ? 'flex-shrink-0' : 'w-0'}`}>
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-10 backdrop-blur-sm" 
                        style={{ willChange: 'opacity' }}
                    />
                )}
            </AnimatePresence>
            
            <motion.div
                initial={false}
                animate={isDesktop ? { width: isCollapsed ? 72 : width } : (isOpen ? 'open' : 'closed')}
                variants={isDesktop ? undefined : mobileVariants}
                transition={{
                    type: isResizing || animationDisabledForResize ? 'tween' : 'spring',
                    duration: isResizing || animationDisabledForResize ? 0 : 0.5,
                    stiffness: 180, // Optimized for smoother performance
                    damping: 24,
                    mass: 1,
                }}
                style={{
                    height: '100%',
                    position: isDesktop ? 'relative' : 'fixed',
                    width: !isDesktop ? 288 : 'auto',
                    left: 0,
                    top: 0,
                    zIndex: isDesktop ? 'auto' : 30,
                    willChange: isResizing ? 'width' : 'width, transform', // GPU hint
                }}
                className="bg-layer-1 border-r border-border flex flex-col transform-gpu shadow-xl md:shadow-none"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div 
                    className="p-3 flex flex-col h-full"
                    style={{ userSelect: isResizing ? 'none' : 'auto' }}
                >
                    <SidebarHeader 
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        setIsOpen={setIsOpen} 
                        onNewChat={handleNewChat}
                    />

                    <SearchInput 
                        ref={searchInputRef}
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                    
                    <motion.div 
                        className="my-4 border-t border-border"
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : 'auto' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    />

                    <HistoryList 
                        history={history}
                        isHistoryLoading={isHistoryLoading}
                        currentChatId={currentChatId}
                        searchQuery={searchQuery}
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        onLoadChat={handleLoadChat}
                        onDeleteChat={onDeleteChat}
                        onUpdateChatTitle={onUpdateChatTitle}
                    />
                    
                    <SidebarFooter 
                        theme={theme}
                        setTheme={setTheme}
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        onClearAllChats={onClearAllChats}
                        onSettingsClick={onSettingsClick}
                    />
                </div>

                {/* Enhanced Resize Handle */}
                {isDesktop && !isCollapsed && (
                    <div
                        className="group absolute top-0 right-0 h-full z-50"
                        style={{ width: '16px', transform: 'translateX(50%)', cursor: 'col-resize' }}
                        onMouseDown={startResizing}
                    >
                        <div className={`w-[1.5px] h-full mx-auto transition-colors duration-200 ${isResizing ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-400/50'}`}></div>
                    </div>
                )}
            </motion.div>
        </aside>
    );
};
