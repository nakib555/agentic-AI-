/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useState, useRef, useEffect } from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types';
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

const ToggleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M1,5 C1,4.44771525 1.44266033,4 1.99895656,4 L3.00104344,4 C3.55275191,4 4,4.44386482 4,5 C4,5.55228475 3.55733967,6 3.00104344,6 L1.99895656,6 C1.44724809,6 1,5.55613518 1,5 Z M12,5 C12,4.44771525 12.444837,4 12.9955775,4 L22.0044225,4 C22.5542648,4 23,4.44386482 23,5 C23,5.55228475 22.555163,6 22.0044225,6 L12.9955775,6 C12.4457352,6 12,5.55613518 12,5 Z M8,6 C7.44771525,6 7,5.55228475 7,5 C7,4.44771525 7.44771525,4 8,4 C8.55228475,4 9,4.44771525 9,5 C9,5.55228475 8.55228475,6 8,6 Z M8,8 C6.34314575,8 5,6.65685425 5,5 C5,3.34314575 6.34314575,2 8,2 C9.65685425,2 11,3.34314575 11,5 C11,6.65685425 9.65685425,8 8,8 Z M1,19 C1,18.4477153 1.44266033,18 1.99895656,18 L3.00104344,18 C3.55275191,18 4,18.4438648 4,19 C4,19.5522847 3.55733967,20 3.00104344,20 L1.99895656,20 C1.44724809,20 1,19.5561352 1,19 Z M12,19 C12,18.4477153 12.444837,18 12.9955775,18 L22.0044225,18 C22.5542648,18 23,18.4438648 23,19 C23,19.5522847 22.555163,20 22.0044225,20 L12.9955775,20 C12.4457352,20 12,19.5561352 12,19 Z M8,20 C7.44771525,20 7,19.5522847 7,19 C7,18.4477153 7.44771525,18 8,18 C8.55228475,18 9,18.4477153 9,19 C9,19.5522847 8.55228475,20 8,20 Z M8,22 C6.34314575,22 5,20.6568542 5,19 C5,17.3431458 6.34314575,16 8,16 C9.65685425,16 11,17.3431458 11,19 C11,20.6568542 9.65685425,22 8,22 Z M1,12 C1,11.4477153 1.4556644,11 1.99539757,11 L10.0046024,11 C10.5543453,11 11,11.4438648 11,12 C11,12.5522847 10.5443356,13 10.0046024,13 L1.99539757,13 C1.44565467,13 1,12.5561352 1,12 Z M19,12 C19,11.4477153 19.4433532,11 20.0093689,11 L21.9906311,11 C22.5480902,11 23,11.4438648 23,12 C23,12.5522847 22.5566468,13 21.9906311,13 L20.0093689,13 C19.4519098,13 19,12.5561352 19,12 Z M15,13 C14.4477153,13 14,12.5522847 14,12 C14,11.4477153 14.4477153,11 15,11 C15.5522847,11 16,11.4477153 16,12 C16,12.5522847 15.5522847,13 15,13 Z M15,15 C13.3431458,15 12,13.6568542 12,12 C12,10.3431458 13.3431458,9 15,9 C16.6568542,9 18,10.3431458 18,12 C18,13.6568542 16.6568542,15 15,15 Z" />
    </svg>
);

const MoreOptionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 682.667 682.667" xmlSpace="preserve" className="w-5 h-5">
        <g>
            <defs>
                <clipPath id="b" clipPathUnits="userSpaceOnUse">
                    <path d="M0 512h512V0H0Z" fill="currentColor" opacity="1"></path>
                </clipPath>
            </defs>
            <mask id="a">
                <rect width="100%" height="100%" fill="#ffffff" opacity="1"></rect>
            </mask>
            <g mask="url(#a)">
                <g clipPath="url(#b)" transform="matrix(1.33333 0 0 -1.33333 0 682.667)">
                    <path d="M0 0v-67.044h-359.948V0c0 6.629-5.374 12.003-12.003 12.003h-42.02c-6.629 0-12.003-5.374-12.003-12.003V-81.561c0-23.154 18.77-41.925 41.925-41.925h408.15c23.154 0 41.925 18.771 41.925 41.925V0c0 6.629-5.374 12.003-12.004 12.003H12.003C5.374 12.003 0 6.629 0 0Z" transform="translate(435.974 149.179)" fill="currentColor"></path>
                    <path d="m0 0-49.801 63.767c-6.598 8.449-19.381 8.449-25.979 0L-125.581 0c-8.451-10.821-.741-26.626 12.99-26.626h28.215v-127.26h43.171v127.26h28.215C.741-26.626 8.452-10.821 0 0Z" transform="translate(231.554 416.203)" fill="currentColor"></path>
                    <path d="m0 0 49.801-63.767c6.598 8.449 19.381 8.449 25.979 0L125.581 0c8.451 10.821.741 26.626-12.99 26.626H84.376v127.26H41.205V26.626H12.99C-.741 26.626-8.452 10.821 0 0Z" transform="translate(280.446 332.42)" fill="currentColor"></path>
                    <path d="M0 0h-235.702c-10.786 0-19.53 8.744-19.53 19.53 0 10.786 8.744 19.53 19.53 19.53H0c10.786 0 19.53-8.744 19.53-19.53C19.53 8.744 10.786 0 0 0Z" transform="translate(373.851 186.827)" fill="currentColor"></path>
                    <path d="M0 0h30.614c10.786 0 19.53-8.744 19.53-19.53 0-10.785-8.744-19.529-19.53-19.529h-235.702c-10.786 0-19.53 8.744-19.53 19.529 0 10.786 8.744 19.53 19.53 19.53H-80" transform="translate(343.237 153.327)" fill="currentColor"></path>
                    <path d="M0 0h.025" transform="translate(303.237 153.327)" fill="currentColor"></path>
                </g>
            </g>
        </g>
    </svg>
);

const MenuItem: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <li>
        <button 
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {children}
        </button>
    </li>
);

export const ChatHeader = ({ handleToggleSidebar, isSidebarOpen, isSidebarCollapsed, onImportChat, onExportChat, onShareChat, isChatActive, isDesktop, chatTitle }: ChatHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isSidebarActive = isDesktop ? !isSidebarCollapsed : isSidebarOpen;

    const getAriaAndTitle = () => {
        if (isDesktop) {
            return isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
        }
        return isSidebarOpen ? "Close sidebar" : "Open sidebar";
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Unified Button Styling ---
    const baseButtonClasses = "p-1.5 rounded-md transition-colors";
    const activeClasses = "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 hover:bg-indigo-200/60 dark:hover:bg-indigo-500/30";
    const inactiveClasses = "text-slate-700 hover:bg-indigo-100/60 hover:text-indigo-800 dark:text-slate-200 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300";
    
    const toggleButtonClasses = `${baseButtonClasses} ${isSidebarActive ? activeClasses : inactiveClasses}`;
    const moreOptionsButtonClasses = `${baseButtonClasses} ${isMenuOpen ? activeClasses : inactiveClasses}`;

    return (
        <header className="py-3 px-4 sm:px-6 md:px-8 flex items-center sticky top-0 z-10 bg-violet-50/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-violet-200/50 dark:border-white/10">
        
        {/* --- Left controls --- */}
        <div className="flex-shrink-0">
            <button
                onClick={handleToggleSidebar}
                className={toggleButtonClasses}
                aria-label={getAriaAndTitle()}
                title={getAriaAndTitle()}
            >
                <ToggleIcon />
            </button>
        </div>

        {/* --- Centered Title --- */}
        <div className="flex-1 min-w-0 text-left md:text-center px-2 sm:px-4">
            {chatTitle && (
                <h1 className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate" title={chatTitle}>
                    {chatTitle}
                </h1>
            )}
        </div>

        {/* --- Right controls --- */}
        <div className="flex-shrink-0">
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className={moreOptionsButtonClasses}
                    aria-label="More chat options"
                    title="More chat options"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <MoreOptionsIcon />
                </button>
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white/80 dark:bg-[#2D2D2D]/80 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-1 z-20"
                        >
                            <ul className="text-sm">
                                <MenuItem onClick={onImportChat} disabled={false}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 0 0 1.09 1.03L9.25 4.636v8.614Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                    <span>Import Chat...</span>
                                </MenuItem>
                                <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>
                                <MenuItem onClick={onShareChat} disabled={!isChatActive}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5ZM12.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" /><path d="M15.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /><path d="M4.5 6.5a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 1 0V6.5Z" /></svg>
                                    <span>Share to Clipboard</span>
                                </MenuItem>
                                <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>
                                <MenuItem onClick={() => onExportChat('md')} disabled={!isChatActive}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                    <span>Export as Markdown</span>
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('json')} disabled={!isChatActive}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                    <span>Export as JSON</span>
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('pdf')} disabled={!isChatActive}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                    <span>Export as PDF</span>
                                </MenuItem>
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
  </header>
);
