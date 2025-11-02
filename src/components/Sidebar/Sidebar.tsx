/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { ColorTheme } from '../../hooks/useColorTheme';

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
    currentChatId: string | null;
    onNewChat: () => void;
    onLoadChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onClearAllChats: () => void;
    onUpdateChatTitle: (id: string, title: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colorTheme: ColorTheme;
    setColorTheme: (theme: ColorTheme) => void;
    onSettingsClick: () => void;
    isDesktop: boolean;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

// FIX: Update the Sidebar component to use React.FC to correctly type its props, resolving an issue where the 'key' prop was not recognized.
export const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    isResizing, setIsResizing, history, currentChatId, onNewChat, onLoadChat,
    onDeleteChat, onClearAllChats, onUpdateChatTitle, theme, setTheme, onSettingsClick,
    isDesktop, colorTheme, setColorTheme
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const prevIsDesktop = useRef(isDesktop);
    const [animationDisabledForResize, setAnimationDisabledForResize] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // This effect detects when the viewport crosses the mobile/desktop breakpoint.
    // It disables animations to prevent layout jumps.
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
                // The search input becomes visible after an animation. We need a small delay
                // before we can focus it, otherwise the focus command might fail.
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCollapsed, isDesktop, isOpen, setIsCollapsed, setIsOpen]);


    return (
        <aside className={`h-full z-20 ${isDesktop ? 'flex-shrink-0' : 'w-0'}`}>
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
                initial={false}
                animate={
                    isDesktop 
                        ? { width: isCollapsed ? 72 : width } 
                        : (isOpen ? 'open' : 'closed')
                }
                variants={isDesktop ? undefined : mobileVariants}
                transition={{
                    type: isResizing || animationDisabledForResize ? 'tween' : 'spring',
                    duration: isResizing || animationDisabledForResize ? 0 : undefined,
                    stiffness: 300,
                    damping: 30,
                    mass: 1.2,
                }}
                style={{
                    height: '100%',
                    position: isDesktop ? 'relative' : 'fixed',
                    width: !isDesktop ? 288 : 'auto', // Explicitly set width for mobile view
                    left: 0,
                    top: 0,
                    zIndex: isDesktop ? 'auto' : 30,
                }}
                className="bg-ui-100 border-r border-color flex flex-col transform-gpu" // Added transform-gpu to promote to its own layer
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div 
                    className="p-3 flex flex-col h-full overflow-hidden"
                    style={{
                        userSelect: isResizing ? 'none' : 'auto',
                    }}
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
                        className="my-4 border-t border-color"
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : 'auto' }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    />

                    <HistoryList 
                        history={history}
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

                {isDesktop && !isCollapsed && (
                    <div
                        onMouseDown={startResizing}
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-primary/30 transition-colors z-10"
                        title="Resize sidebar"
                    />
                )}
            </motion.div>
        </aside>
    );
};