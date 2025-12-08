
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { NavItem } from './NavItem';
import type { ChatSession } from '../../types';
import { SidebarHeader } from './SidebarHeader';
import { SearchInput } from './SearchInput';
import { NewChatButton } from './NewChatButton';
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
    isNewChatDisabled?: boolean;
    onLoadChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onUpdateChatTitle: (id: string, title: string) => void;
    onSettingsClick: () => void;
    isDesktop: boolean;
};

const mobileVariants = {
    open: { translateX: '0%' },
    closed: { translateX: '-100%' },
};

const SidebarRaw: React.FC<SidebarProps> = ({ 
    isOpen, setIsOpen, isCollapsed, setIsCollapsed, width, setWidth,
    isResizing, setIsResizing, history, isHistoryLoading, currentChatId, onNewChat, isNewChatDisabled, onLoadChat,
    onDeleteChat, onUpdateChatTitle, onSettingsClick,
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
        <aside className={`h-full z-30 ${isDesktop ? 'flex-shrink-0' : 'fixed inset-0 pointer-events-none'}`}>
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 pointer-events-auto" 
                        style={{ willChange: 'opacity' }}
                    />
                )}
            </AnimatePresence>
            
            <motion.div
                initial={false}
                animate={isDesktop ? { width: isCollapsed ? 80 : width } : (isOpen ? 'open' : 'closed')}
                variants={isDesktop ? undefined : mobileVariants}
                transition={{
                    type: isResizing || animationDisabledForResize ? 'tween' : 'spring',
                    duration: isResizing || animationDisabledForResize ? 0 : 0.5,
                    stiffness: 180,
                    damping: 24,
                    mass: 1,
                }}
                style={{
                    height: '100%',
                    position: isDesktop ? 'relative' : 'absolute',
                    width: !isDesktop ? '85%' : 'auto',
                    maxWidth: !isDesktop ? '320px' : 'none',
                    left: 0,
                    top: 0,
                    zIndex: 40,
                    willChange: isResizing ? 'width' : 'width, transform',
                    pointerEvents: 'auto'
                }}
                className={`
                    flex flex-col transform-gpu
                    bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e0e7ff]
                    dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e1b4b]
                    border-r border-white/20 dark:border-white/5
                    shadow-2xl
                `}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Colorful Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 opacity-90" />

                <div 
                    className="p-4 flex flex-col h-full relative z-10"
                    style={{ userSelect: isResizing ? 'none' : 'auto' }}
                >
                    <SidebarHeader 
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        setIsOpen={setIsOpen} 
                    />

                    <div className="space-y-4 flex-shrink-0 mb-4">
                        <SearchInput 
                            ref={searchInputRef}
                            isCollapsed={isCollapsed}
                            isDesktop={isDesktop}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />

                        <NewChatButton
                            isCollapsed={isCollapsed}
                            isDesktop={isDesktop}
                            onClick={handleNewChat}
                            disabled={isNewChatDisabled}
                        />
                    </div>
                    
                    <motion.div 
                        className="mb-2 h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-900/50 to-transparent"
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
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
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        onSettingsClick={onSettingsClick}
                    />
                </div>

                {/* Resize Handle */}
                {isDesktop && !isCollapsed && (
                    <div
                        className="group absolute top-0 right-0 h-full z-50 flex justify-center w-4 cursor-col-resize translate-x-1/2"
                        onMouseDown={startResizing}
                    >
                        <div className={`w-[1px] h-full transition-colors duration-200 bg-transparent group-hover:bg-indigo-500/30 ${isResizing ? 'bg-indigo-500' : ''}`}></div>
                    </div>
                )}
            </motion.div>
        </aside>
    );
};

export const Sidebar = memo(SidebarRaw);
