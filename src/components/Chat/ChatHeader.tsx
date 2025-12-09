/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { TextType } from '../UI/TextType';
const motion = motionTyped as any;

type ChatHeaderProps = {
  handleToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  onImportChat: () => void;
  onExportChat: (format: 'md' | 'json' | 'pdf') => void;
  onShareChat: () => void;
  isChatActive: boolean;
  isDesktop: boolean;
  chatTitle: string | null;
};

// Standardized Icon Components
const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const MenuItem: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; label: string }> = ({ onClick, disabled, children, label }) => (
    <li>
        <button 
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span className="text-slate-400 dark:text-slate-500 w-5 h-5 flex items-center justify-center">{children}</span>
            <span>{label}</span>
        </button>
    </li>
);

export const ChatHeader = ({ handleToggleSidebar, isSidebarOpen, isSidebarCollapsed, onImportChat, onExportChat, onShareChat, isChatActive, isDesktop, chatTitle }: ChatHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [isAnimatingTitle, setIsAnimatingTitle] = useState(false);
    const [animationKey, setAnimationKey] = useState(chatTitle);
    const prevChatTitleRef = useRef(chatTitle);

    useEffect(() => {
        const prevTitle = prevChatTitleRef.current;
        const isGenerated = chatTitle && chatTitle !== 'New Chat' && chatTitle !== 'Generating title...';
        const wasPlaceholder = prevTitle === 'New Chat' || prevTitle === 'Generating title...';

        if (wasPlaceholder && isGenerated) {
            setAnimationKey(chatTitle);
            setIsAnimatingTitle(true);
        } else {
            setIsAnimatingTitle(false);
        }
        prevChatTitleRef.current = chatTitle;
    }, [chatTitle]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const btnBaseClass = "w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200";

    return (
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm sticky top-0 z-20">
            {/* Left: Mobile Sidebar Toggle */}
            <div className="flex items-center gap-3 min-w-0">
                {!isDesktop && (
                    <button
                        onClick={handleToggleSidebar}
                        className={btnBaseClass}
                        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        <MenuIcon />
                    </button>
                )}
                
                {/* Title */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={chatTitle || 'empty'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate"
                        >
                            {isAnimatingTitle && animationKey ? (
                                <TextType
                                    text={['New Chat', animationKey]}
                                    loop={false}
                                    onSequenceComplete={() => setIsAnimatingTitle(false)}
                                    className="inline-block"
                                />
                            ) : (
                                <span>{chatTitle || 'Agentic AI'}</span>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`${btnBaseClass} ${isMenuOpen ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100' : ''}`}
                    aria-label="Chat options"
                >
                    <MoreIcon />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#2D2D2D] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 p-1.5 z-50 origin-top-right"
                        >
                            <ul className="flex flex-col gap-0.5">
                                <li className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</li>
                                <MenuItem onClick={onShareChat} disabled={!isChatActive} label="Copy Conversation">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" /><path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" /></svg>
                                </MenuItem>
                                
                                <li className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />
                                
                                <li className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Export</li>
                                <MenuItem onClick={() => onExportChat('md')} disabled={!isChatActive} label="Markdown (.md)">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Zm10.854 4.646a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L10.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0Z" clipRule="evenodd" /></svg>
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('json')} disabled={!isChatActive} label="JSON Data (.json)">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM5.94 6.757a.75.75 0 0 1 1.06-.04l1.586 1.446a.25.25 0 0 0 .368-.035l2.09-2.508a.75.75 0 1 1 1.152.96L9.67 9.61a1.75 1.75 0 0 1-2.584.24l-2.106-1.92a.75.75 0 0 1-.04-1.173Z" clipRule="evenodd" /></svg>
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('pdf')} disabled={!isChatActive} label="Document (.pdf)">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6a.75.75 0 0 0-1.5 0v3.19l-1.72-1.72a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8Z" clipRule="evenodd" /></svg>
                                </MenuItem>
                                
                                <li className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />
                                
                                <MenuItem onClick={() => { onImportChat(); setIsMenuOpen(false); }} disabled={false} label="Import Chat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 11.25a.75.75 0 0 0 1.5 0v-4.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.69Z" clipRule="evenodd" /></svg>
                                </MenuItem>
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};
