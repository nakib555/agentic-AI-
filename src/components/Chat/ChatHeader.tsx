
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

// ... Icons reused from original file ...
const ToggleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
    </svg>
);

const MoreOptionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
    </svg>
);

const ShareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8.5 6.5a.5.5 0 0 0-1 0v.518a4.5 4.5 0 0 0 0 5.964V13.5a.5.5 0 0 0 1 0v-.518a4.5 4.5 0 0 0 0-5.964V6.5Z" /><path fillRule="evenodd" d="M12.634 11.634a.5.5 0 0 0 .707-.707l-2.633-2.634a.5.5 0 0 0-.707.707l2.633 2.634Z" clipRule="evenodd" /><path fillRule="evenodd" d="M7.366 11.634a.5.5 0 0 1-.707-.707l2.633-2.634a.5.5 0 1 1 .707.707L7.366 11.634Z" clipRule="evenodd" /></svg>);
const ImportIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6.75a.75.75 0 0 1 1.5 0v2.546l.943-1.048a.75.75 0 0 1 1.114 1.004l-2.25 2.5a.75.75 0 0 1-1.114 0l-2.25-2.5a.75.75 0 1 1 1.114-1.004l.943 1.048V8.75Z" clipRule="evenodd" /></svg>);
const ExportIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" /></svg>);
const CodeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6.28 5.22a.75.75 0 0 1 0 1.06L2.56 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L.97 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm7.44 0a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>);
const PdfIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.121 4.12a1.5 1.5 0 0 1 .44 1.061V16.5a1.5 1.5 0 0 1-1.5 1.5h-11a1.5 1.5 0 0 1-1.5-1.5v-13Zm8 0v3.75a.75.75 0 0 0 .75.75h3.75V16.5h-11v-13h6.5Z" clipRule="evenodd" /></svg>);

const MenuItem: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; label: string }> = ({ onClick, disabled, children, label }) => (
    <li>
        <motion.button 
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-content-primary hover:bg-layer-2 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
            whileHover={{ x: 4 }}
        >
            <span className="text-content-tertiary group-hover:text-primary-main">{children}</span>
            <span>{label}</span>
        </motion.button>
    </li>
);

const MenuSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-content-tertiary select-none mt-1">
        {children}
    </li>
);

const MenuDivider = () => <li className="my-1 h-px bg-border-subtle mx-3" />;

export const ChatHeader = ({ handleToggleSidebar, isSidebarOpen, isSidebarCollapsed, onImportChat, onExportChat, onShareChat, isChatActive, isDesktop, chatTitle }: ChatHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [isAnimatingTitle, setIsAnimatingTitle] = useState(false);
    const [animationKey, setAnimationKey] = useState(chatTitle);
    const prevChatTitleRef = useRef(chatTitle);

    const isSidebarActive = isDesktop ? !isSidebarCollapsed : isSidebarOpen;

    const getAriaAndTitle = () => {
        if (isDesktop) return isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
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

    const buttonBaseClasses = "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm";
    const buttonActive = "bg-primary-subtle text-primary-main border-primary-main/20";
    const buttonInactive = "bg-layer-1 text-content-secondary border-border hover:bg-layer-2 hover:text-content-primary";

    return (
        <header className="absolute top-0 left-0 right-0 z-20 px-4 py-3 pointer-events-none">
            <div className="flex items-center justify-between gap-4 pointer-events-auto">
            
                {/* Toggle Sidebar */}
                <button
                    onClick={handleToggleSidebar}
                    className={`${buttonBaseClasses} ${isSidebarActive ? buttonActive : buttonInactive}`}
                    aria-label={getAriaAndTitle()}
                    title={getAriaAndTitle()}
                >
                    <ToggleIcon />
                </button>

                {/* Title (Mobile/Tablet centered, fading) */}
                <div className="flex-1 text-center overflow-hidden">
                    <AnimatePresence>
                        {chatTitle && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="inline-block"
                            >
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-layer-1/80 backdrop-blur-md border border-white/10 shadow-sm text-sm font-semibold text-content-primary truncate max-w-[200px] sm:max-w-md">
                                    {isAnimatingTitle && animationKey ? (
                                        <TextType
                                            key={animationKey}
                                            text={['New Chat', animationKey]}
                                            loop={false}
                                            onSequenceComplete={() => setIsAnimatingTitle(false)}
                                        />
                                    ) : chatTitle}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Options Menu */}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className={`${buttonBaseClasses} ${isMenuOpen ? buttonActive : buttonInactive}`}
                        aria-label="Chat options"
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
                                // Optimized Blur: backdrop-blur-lg instead of 2xl
                                className="absolute right-0 top-full mt-2 w-64 bg-layer-1/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-2 z-50 origin-top-right ring-1 ring-black/5"
                            >
                                <ul className="flex flex-col">
                                    <MenuSectionTitle>Actions</MenuSectionTitle>
                                    <MenuItem onClick={onShareChat} disabled={!isChatActive} label="Copy to Clipboard">
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
