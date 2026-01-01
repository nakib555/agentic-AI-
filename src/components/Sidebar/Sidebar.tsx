
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion as motionTyped, AnimatePresence, PanInfo } from 'framer-motion';
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

// Simplified mobile animation variants - Bottom Sheet Style
const mobileVariants = {
    open: { y: '0%' },
    closed: { y: '100%' },
};

export const Sidebar: React.FC<SidebarProps> = ({ 
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

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!isDesktop) {
            // Close if dragged down sufficiently or flicked
            if (info.offset.y > 100 || (info.velocity.y > 300 && info.offset.y > 0)) {
                setIsOpen(false);
            }
        }
    };

    return (
        <aside className={`h-full flex-shrink-0 ${isDesktop ? 'relative z-20' : 'fixed inset-0 z-40 pointer-events-none'}`}>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
                        style={{ willChange: 'opacity' }}
                    />
                )}
            </AnimatePresence>
            
            {/* Sidebar Content */}
            <motion.div
                initial={false}
                animate={isDesktop ? { width: isCollapsed ? 72 : width } : (isOpen ? 'open' : 'closed')}
                variants={isDesktop ? undefined : mobileVariants}
                transition={{
                    type: isResizing || animationDisabledForResize ? 'tween' : 'spring',
                    duration: isResizing || animationDisabledForResize ? 0 : 0.4,
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
                drag={!isDesktop ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={onDragEnd}
                style={{
                    height: isDesktop ? '100%' : '85vh',
                    position: isDesktop ? 'relative' : 'absolute',
                    width: isDesktop ? 'auto' : '100%',
                    left: 0,
                    top: isDesktop ? 0 : undefined,
                    bottom: isDesktop ? undefined : 0,
                    pointerEvents: 'auto',
                    willChange: isResizing ? 'width' : 'transform, width',
                }}
                className={`bg-layer-1 flex flex-col transform-gpu shadow-2xl md:shadow-none overflow-hidden ${
                    isDesktop ? 'border-r border-border' : 'border-t border-border rounded-t-2xl'
                }`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Drag Handle for Mobile */}
                {!isDesktop && (
                    <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0" onClick={() => setIsOpen(false)}>
                        <div className="h-1.5 w-12 bg-gray-300 dark:bg-slate-600 rounded-full" />
                    </div>
                )}

                <div 
                    className="p-3 flex flex-col h-full group"
                    style={{ 
                        userSelect: isResizing ? 'none' : 'auto',
                        paddingBottom: !isDesktop ? 'env(safe-area-inset-bottom)' : '0.75rem', // Standard p-3 is 0.75rem
                        paddingTop: !isDesktop ? '0' : '0.75rem'
                    }}
                >
                    <SidebarHeader 
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        setIsOpen={setIsOpen} 
                        setIsCollapsed={setIsCollapsed}
                    />

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
                    
                    <motion.div 
                        className="mb-2 border-t border-border"
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
                        isCollapsed={isCollapsed}
                        isDesktop={isDesktop}
                        onSettingsClick={onSettingsClick}
                    />
                </div>

                {/* Resize Handle */}
                {isDesktop && !isCollapsed && (
                    <div
                        className="group absolute top-0 right-0 h-full z-50 w-4 translate-x-2 cursor-col-resize flex justify-center hover:bg-transparent"
                        onMouseDown={startResizing}
                    >
                        <div className={`w-[2px] h-full transition-colors duration-200 ${isResizing ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-400/50'}`}></div>
                    </div>
                )}
                
                {/* Desktop Expand Button */}
                {isDesktop && isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="absolute -right-3 top-12 w-6 h-12 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-indigo-500 shadow-sm cursor-pointer z-50 opacity-0 group-hover:opacity-100 transition-opacity delay-300"
                        title="Expand sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                )}
            </motion.div>
        </aside>
    );
};
