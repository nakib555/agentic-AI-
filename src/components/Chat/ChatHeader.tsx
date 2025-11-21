

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

const ToggleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M1,5 C1,4.44771525 1.44266033,4 1.99895656,4 L3.00104344,4 C3.55275191,4 4,4.44386482 4,5 C4,5.55228475 3.55733967,6 3.00104344,6 L1.99895656,6 C1.44724809,6 1,5.55613518 1,5 Z M12,5 C12,4.44771525 12.444837,4 12.9955775,4 L22.0044225,4 C22.5542648,4 23,4.44386482 23,5 C23,5.55228475 22.555163,6 22.0044225,6 L12.9955775,6 C12.4457352,6 12,5.55613518 12,5 Z M8,6 C7.44771525,6 7,5.55228475 7,5 C7,4.44771525 7.44771525,4 8,4 C8.55228475,4 9,4.44771525 9,5 C9,5.55228475 8.55228475,6 8,6 Z M8,8 C6.34314575,8 5,6.65685425 5,5 C5,3.34314575 6.34314575,2 8,2 C9.65685425,2 11,3.34314575 11,5 C11,6.65685425 9.65685425,8 8,8 Z M1,19 C1,18.4477153 1.44266033,18 1.99895656,18 L3.00104344,18 C3.55275191,18 4,18.4438648 4,19 C4,19.5522847 3.55733967,20 3.00104344,20 L1.99895656,20 C1.44724809,20 1,19.5561352 1,19 Z M12,19 C12,18.4477153 12.444837,18 12.9955775,18 L22.0044225,18 C22.5542648,18 23,18.4438648 23,19 C23,19.5522847 22.555163,20 22.0044225,20 L12.9955775,20 C12.4457352,20 12,19.5561352 12,19 Z M8,20 C7.44771525,20 7,19.5522847 7,19 C7,18.4477153 7.44771525,18 8,18 C8.55228475,18 9,18.4477153 9,19 C9,19.5522847 8.55228475,20 8,20 Z M8,22 C6.34314575,22 5,20.6568542 5,19 C5,17.3431458 6.34314575,16 8,16 C9.65685425,16 11,17.3431458 11,19 C11,20.6568542 9.65685425,22 8,22 Z M1,12 C1,11.4477153 1.4556644,11 1.99539757,11 L10.0046024,11 C10.5543453,11 11,11.4438648 11,12 C11,12.5522847 10.5443356,13 10.0046024,13 L1.99539757,13 C1.44565467,13 1,12.5561352 1,12 Z M19,12 C19,11.4477153 19.4433532,11 20.0093689,11 L21.9906311,11 C22.5480902,11 23,11.4438648 23,12 C23,12.5522847 22.5566468,13 21.9906311,13 L20.0093689,13 C19.4519098,13 19,12.5561352 19,12 Z M15,13 C14.4477153,13 14,12.5522847 14,12 C14,11.4477153 14.4477153,11 15,11 C15.5522847,11 16,11.4477153 16,12 C16,12.5522847 15.5522847,13 15,13 Z M15,15 C13.3431458,15 12,13.6568542 12,12 C12,10.3431458 13.3431458,9 15,9 C16.6568542,9 18,10.3431458 18,12 C18,13.6568542 16.6568542,15 15,15 Z" />
    </svg>
);

const MoreOptionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 682.667 682.667" className="w-5 h-5" fill="currentColor">
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
                    <path d="m0 0 49.801-63.767c6.598 8.449 19.381 8.449 25.979 0L125.581 0c8.451 10.821.741-26.626 12.99-26.626H84.376v127.26H41.205V26.626H12.99C-.741 26.626-8.452 10.821 0 0Z" transform="translate(280.446 332.42)" fill="currentColor"></path>
                    <path d="M0 0h-235.702c-10.786 0-19.53 8.744-19.53 19.53 0 10.786 8.744 19.53 19.53 19.53H0c10.786 0 19.53-8.744 19.53-19.53C19.53 8.744 10.786 0 0 0Z" transform="translate(373.851 186.827)" fill="currentColor"></path>
                    <path d="M0 0h30.614c10.786 0 19.53-8.744 19.53-19.53 0-10.785-8.744-19.529-19.53-19.529h-235.702c-10.786 0-19.53 8.744-19.53 19.529 0 10.786 8.744 19.53 19.53 19.53H-80" transform="translate(343.237 153.327)" fill="currentColor"></path>
                    <path d="M0 0h.025" transform="translate(303.237 153.327)" fill="currentColor"></path>
                </g>
            </mask>
            <g mask="url(#a)">
                <g clipPath="url(#b)" transform="matrix(1.33333 0 0 -1.33333 0 682.667)">
                    <path d="M0 0h-235.702c-10.786 0-19.53 8.744-19.53 19.53 0 10.786 8.744 19.53 19.53 19.53H0c10.786 0 19.53-8.744 19.53-19.53C19.53 8.744 10.786 0 0 0Z" transform="translate(373.851 186.827)" fill="currentColor"></path>
                    <path d="M0 0h30.614c10.786 0 19.53-8.744 19.53-19.53 0-10.785-8.744-19.529-19.53-19.529h-235.702c-10.786 0-19.53 8.744-19.53 19.529 0 10.786 8.744 19.53 19.53 19.53H-80" transform="translate(343.237 153.327)" fill="currentColor"></path>
                    <path d="M0 0h.025" transform="translate(303.237 153.327)" fill="currentColor"></path>
                </g>
            </mask>
        </g>
    </svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" />
      <path fillRule="evenodd" d="M12.634 11.634a.5.5 0 0 0 .707-.707l-2.633-2.634a.5.5 0 0 0-.707.707l2.633 2.634Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M7.366 11.634a.5.5 0 0 1-.707-.707l2.633-2.634a.5.5 0 1 1 .707.707L7.366 11.634Z" clipRule="evenodd" />
    </svg>
);


export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
    handleToggleSidebar, 
    isSidebarOpen,
    isSidebarCollapsed,
    onImportChat,
    onExportChat,
    onShareChat,
    isChatActive,
    isDesktop,
    chatTitle,
}) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node) &&
                moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)
            ) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isCollapsible = isDesktop;
    const showChatTitle = isChatActive;

    return (
        <header className="relative flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={handleToggleSidebar}
                    className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
                    aria-label={isSidebarOpen || isSidebarCollapsed ? "Close sidebar" : "Open sidebar"}
                >
                    <ToggleIcon />
                </button>
                {showChatTitle && (
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-[300px]">
                        <TextType text={chatTitle || "New Chat"} />
                    </h1>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {isChatActive && (
                     <button
                        onClick={onShareChat}
                        className="flex items-center gap-2 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                        title="Share Chat"
                        aria-label="Share Chat"
                    >
                        <ShareIcon />
                        <span className="hidden sm:block">Share</span>
                    </button>
                )}

                <div className="relative">
                    <button
                        ref={moreButtonRef}
                        onClick={() => setIsMoreMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                        title="More Options"
                        aria-label="More Options"
                        aria-haspopup="true"
                        aria-expanded={isMoreMenuOpen}
                    >
                        <MoreOptionsIcon />
                        <span className="hidden sm:block">More</span>
                    </button>
                    <AnimatePresence>
                        {isMoreMenuOpen && (
                            <motion.div
                                ref={moreMenuRef}
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-12 z-20 w-40 bg-white dark:bg-[#2D2D2D] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ul className="text-sm">
                                    <li>
                                        <button onClick={onImportChat} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M4.75 2A1.75 1.75 0 0 0 3 3.75v8.5A1.75 1.75 0 0 0 4.75 14h6.5A1.75 1.75 0 0 0 13 12.25v-6.5L9.25 2H4.75ZM8.5 2.75V6H12v6.25a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-8.5a.25.25 0 0 1 .25-.25H8.5Z" /></svg>
                                            <span>Import Chat</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => { onExportChat('json'); setIsMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M4.75 2A1.75 1.75 0 0 0 3 3.75v8.5A1.75 1.75 0 0 0 4.75 14h6.5A1.75 1.75 0 0 0 13 12.25v-6.5L9.25 2H4.75ZM8.5 2.75V6H12v6.25a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-8.5a.25.25 0 0 1 .25-.25H8.5Z" /></svg>
                                            <span>Export as JSON</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => { onExportChat('md'); setIsMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.5 1.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5ZM13.25 5a.75.75 0 0 1 .75.75v7.5c0 .414-.336.75-.75.75H2.75a.75.75 0 0 1-.75-.75v-7.5c0-.414.336-.75.75-.75h2a.75.75 0 0 0 0 1.5h-.75v6h10v-6H11a.75.75 0 0 0 0-1.5h2.25ZM9 1.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5ZM6.5 1.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z" clipRule="evenodd" /></svg>
                                            <span>Export as Markdown</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => { onExportChat('pdf'); setIsMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M3 4.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM3.75 6a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM3 9.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" /><path fillRule="evenodd" d="M6.25 1.75H10A.75.75 0 0 1 10.75 2v.25a.75.75 0 0 1-.75.75H9.25a.75.75 0 0 0-.75.75v.25a.75.75 0 0 1-.75.75H6.25A2.75 2.75 0 0 0 3.5 6.75v6.5A2.75 2.75 0 0 0 6.25 16h6.5A2.75 2.75 0 0 0 15.5 13.25V6.75A2.75 2.75 0 0 0 12.75 4H12a.75.75 0 0 0-.75.75v.25c0 .414.336.75.75.75h.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 0-.75.75v.25a.75.75 0 0 1-.75.75H6.25a.75.75 0 0 1-.75-.75V6.75c0-.414.336-.75.75-.75h.5A.75.75 0 0 0 6.5 5.25v-.25c0-.414.336-.75.75-.75h.5a.75.75 0 0 0 0-1.5h-.5c-.414 0-.75-.336-.75-.75v-.25A.75.75 0 0 1 6.25 1.75Z" clipRule="evenodd" /></svg>
                                            <span>Export as PDF</span>
                                        </button>
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};