
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
                    <path d="m0 0 49.801-63.767c6.598 8.449 19.381 8.449 25.979 0L125.581 0c8.451 10.821.741 26.626-12.99 26.626H84.376v127.26H41.205V26.626H12.99C-.741 26.626-8.452 10.821 0 0Z" transform="translate(280.446 332.42)" fill="currentColor"></path>
                    <path d="M0 0h-235.702c-10.786 0-19.53 8.744-19.53 19.53 0 10.786 8.744 19.53 19.53 19.53H0c10.786 0 19.53-8.744 19.53-19.53C19.53 8.744 10.786 0 0 0Z" transform="translate(373.851 186.827)" fill="currentColor"></path>
                    <path d="M0 0h30.614c10.786 0 19.53-8.744 19.53-19.53 0-10.785-8.744-19.529-19.53-19.529h-235.702c-10.786 0-19.53 8.744-19.53 19.529 0 10.786 8.744 19.53 19.53 19.53H-80" transform="translate(343.237 153.327)" fill="currentColor"></path>
                    <path d="M0 0h.025" transform="translate(303.237 153.327)" fill="currentColor"></path>
                </g>
            </g>
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

const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6.75a.75.75 0 0 1 1.5 0v2.546l.943-1.048a.75.75 0 0 1 1.114 1.004l-2.25 2.5a.75.75 0 0 1-1.114 0l-2.25-2.5a.75.75 0 1 1 1.114-1.004l.943 1.048V8.75Z" clipRule="evenodd" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
    </svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 0 1 0 1.06L2.56 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L.97 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm7.44 0a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const PdfIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.121 4.12a1.5 1.5 0 0 1 .44 1.061V16.5a1.5 1.5 0 0 1-1.5 1.5h-11a1.5 1.5 0 0 1-1.5-1.5v-13Zm8 0v3.75a.75.75 0 0 0 .75.75h3.75V16.5h-11v-13h6.5Z" clipRule="evenodd" />
    </svg>
);

const MenuItem: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; label: string }> = ({ onClick, disabled, children, label }) => (
    <li>
        <motion.button 
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            whileHover={{ x: 2, backgroundColor: 'rgba(var(--primary-main), 0.1)' }}
        >
            <span className="text-slate-400 dark:text-slate-500">{children}</span>
            <span>{label}</span>
        </motion.button>
    </li>
);

const MenuSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 opacity-70 select-none mt-1">
        {children}
    </li>
);

const MenuDivider = () => <li className="my-1 h-px bg-slate-100 dark:bg-white/10 mx-2" />;

export const ChatHeader = ({ handleToggleSidebar, isSidebarOpen, isSidebarCollapsed, onImportChat, onExportChat, onShareChat, isChatActive, isDesktop, chatTitle }: ChatHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [isAnimatingTitle, setIsAnimatingTitle] = useState(false);
    const [animationKey, setAnimationKey] = useState(chatTitle);
    const prevChatTitleRef = useRef(chatTitle);


    const isSidebarActive = isDesktop ? !isSidebarCollapsed : isSidebarOpen;

    const getAriaAndTitle = () => {
        if (isDesktop) {
            return isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
        }
        return isSidebarOpen ? "Close sidebar" : "Open sidebar";
    };

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

    const baseButtonClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 backdrop-blur-md border shadow-sm hover:scale-105 active:scale-95";
    const activeClasses = "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40";
    const inactiveClasses = "bg-white/60 text-slate-700 border-slate-200/80 hover:bg-white/90 dark:bg-black/20 dark:text-slate-200 dark:border-white/10 dark:hover:bg-black/40";
    
    const toggleButtonClasses = `${baseButtonClasses} ${isSidebarActive ? activeClasses : inactiveClasses}`;
    const moreOptionsButtonClasses = `${baseButtonClasses} ${isMenuOpen ? activeClasses : inactiveClasses}`;

    return (
        <header className="py-3 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-10 gap-4">
        
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
        <div className="flex-1 min-w-0 text-center">
            <AnimatePresence>
                {chatTitle && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="inline-block text-sm font-semibold text-gray-800 dark:text-slate-200 px-4 py-2 rounded-full bg-white/60 dark:bg-black/20 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm min-h-[32px]" title={chatTitle}>
                        
                        {isAnimatingTitle && animationKey ? (
                            <TextType
                                key={animationKey}
                                text={['New Chat', animationKey]}
                                loop={false}
                                onSequenceComplete={() => setIsAnimatingTitle(false)}
                            />
                        ) : (
                            <span className="truncate max-w-[200px] sm:max-w-sm md:max-w-md inline-block align-middle">
                                {chatTitle}
                            </span>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- Right controls --- */}
        <div className="flex-shrink-0">
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className={moreOptionsButtonClasses}
                    aria-label="Chat options"
                    title="Chat options"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <MoreOptionsIcon />
                </button>
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 p-2 z-20 origin-top-right overflow-hidden"
                        >
                            <ul className="flex flex-col">
                                <MenuSectionTitle>Actions</MenuSectionTitle>
                                <MenuItem onClick={onShareChat} disabled={!isChatActive} label="Share to Clipboard">
                                    <ShareIcon />
                                </MenuItem>

                                <MenuDivider />
                                
                                <MenuSectionTitle>Management</MenuSectionTitle>
                                <MenuItem onClick={() => { onImportChat(); setIsMenuOpen(false); }} disabled={false} label="Import Chat...">
                                    <ImportIcon />
                                </MenuItem>

                                <MenuDivider />

                                <MenuSectionTitle>Export</MenuSectionTitle>
                                <MenuItem onClick={() => onExportChat('md')} disabled={!isChatActive} label="Markdown">
                                    <ExportIcon />
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('json')} disabled={!isChatActive} label="JSON">
                                    <CodeIcon />
                                </MenuItem>
                                <MenuItem onClick={() => onExportChat('pdf')} disabled={!isChatActive} label="PDF">
                                    <PdfIcon />
                                </MenuItem>
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
  </header>
);
};
