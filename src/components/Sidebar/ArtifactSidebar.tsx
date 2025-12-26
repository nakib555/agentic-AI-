
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../hooks/useTheme';

type ArtifactSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language: string;
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
};

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-500">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export const ArtifactSidebar: React.FC<ArtifactSidebarProps> = ({ 
    isOpen, onClose, content, language, width, setWidth, isResizing, setIsResizing 
}) => {
    const { isDesktop } = useViewport();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    const [iframeKey, setIframeKey] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    // Auto-switch to preview for visual languages
    useEffect(() => {
        if (['html', 'svg'].includes(language)) {
            setActiveTab('preview');
        } else {
            setActiveTab('code');
        }
    }, [language, content]);

    // Force iframe refresh when content changes
    useEffect(() => {
        setIframeKey(prev => prev + 1);
    }, [content]);

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            // Clamp width
            setWidth(Math.max(300, Math.min(newWidth, window.innerWidth * 0.8)));
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenNewTab = () => {
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(getPreviewContent());
            win.document.close();
        }
    };

    const isPreviewable = ['html', 'svg', 'javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language);

    const getPreviewContent = () => {
        if (language === 'html' || language === 'svg') return content;
        // Basic wrapping for JS/TS to run in browser
        if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language)) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>body { font-family: system-ui, sans-serif; padding: 20px; }</style>
                </head>
                <body>
                    <div id="root"></div>
                    <div id="output"></div>
                    <script>
                        const root = document.getElementById('root');
                        const console = {
                            log: (...args) => {
                                const output = document.getElementById('output');
                                output.innerHTML += '<div>' + args.join(' ') + '</div>';
                            },
                            error: (...args) => {
                                const output = document.getElementById('output');
                                output.innerHTML += '<div style="color: red">' + args.join(' ') + '</div>';
                            }
                        };
                        try {
                            ${content}
                        } catch (e) {
                            console.error(e);
                        }
                    </script>
                </body>
                </html>
            `;
        }
        return '';
    };

    const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
        : theme;

    return (
        <motion.aside
            initial={false}
            animate={isOpen ? (isDesktop ? { width } : { y: 0 }) : (isDesktop ? { width: 0 } : { y: '100%' })}
            transition={{ type: isResizing ? 'tween' : 'spring', stiffness: 300, damping: 30 }}
            className={`
                flex-shrink-0 bg-gray-50 dark:bg-[#0c0c0c] overflow-hidden flex flex-col z-30
                ${isDesktop 
                    ? 'relative border-l border-gray-200 dark:border-white/10 h-full' 
                    : 'fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 dark:border-white/10 h-[85vh] rounded-t-2xl shadow-2xl'
                }
            `}
        >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-md border border-gray-200 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">
                            {language || 'TXT'}
                        </span>
                    </div>
                    {isPreviewable && (
                        <div className="flex bg-gray-100 dark:bg-black/40 p-0.5 rounded-lg border border-gray-200 dark:border-white/5">
                            <button 
                                onClick={() => setActiveTab('code')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    activeTab === 'code' 
                                    ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <CodeIcon />
                                Code
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    activeTab === 'preview' 
                                    ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <EyeIcon />
                                Preview
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Copy code"
                    >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Close artifact"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative group/content">
                {activeTab === 'code' ? (
                    <div className="absolute inset-0 overflow-auto custom-scrollbar bg-white dark:bg-[#0d0d0d]">
                        <SyntaxHighlighter
                            language={language}
                            style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
                            customStyle={{ 
                                margin: 0, 
                                padding: '1.5rem', 
                                minHeight: '100%', 
                                fontSize: '13px', 
                                lineHeight: '1.5',
                                fontFamily: "'Fira Code', monospace",
                                backgroundColor: 'transparent'
                            }}
                            showLineNumbers={true}
                            wrapLines={false} 
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', opacity: 0.3 }}
                        >
                            {content}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-100 dark:bg-[#1a1a1a] flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#202020] border-b border-gray-200 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIframeKey(k => k + 1)} 
                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors"
                                    title="Reload Preview"
                                >
                                    <RefreshIcon />
                                </button>
                                <button 
                                    onClick={handleOpenNewTab}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors"
                                    title="Open in New Tab"
                                >
                                    <ExternalLinkIcon />
                                </button>
                            </div>
                        </div>
                        <iframe 
                            key={iframeKey}
                            srcDoc={getPreviewContent()}
                            className="flex-1 w-full h-full border-none bg-white"
                            sandbox="allow-scripts allow-modals allow-forms allow-popups"
                            title="Artifact Preview"
                        />
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            {isDesktop && (
                <div 
                    onMouseDown={startResizing} 
                    className={`
                        absolute top-0 left-0 w-1 h-full cursor-col-resize z-50 transition-colors
                        ${isResizing ? 'bg-indigo-500' : 'hover:bg-indigo-500/50 bg-transparent'}
                    `}
                >
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-1 w-3 h-8 bg-black/20 dark:bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                </div>
            )}
        </motion.aside>
    );
};
