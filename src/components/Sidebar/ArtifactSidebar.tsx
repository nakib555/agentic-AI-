
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';
import { TabButton } from '../UI/TabButton';
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

export const ArtifactSidebar: React.FC<ArtifactSidebarProps> = ({ 
    isOpen, onClose, content, language, width, setWidth, isResizing, setIsResizing 
}) => {
    const { isDesktop } = useViewport();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    const [iframeKey, setIframeKey] = useState(0);

    // Auto-switch to preview for HTML
    useEffect(() => {
        if (language === 'html' || language === 'svg') {
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
            setWidth(window.innerWidth - e.clientX);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const isPreviewable = language === 'html' || language === 'svg' || language === 'javascript' || language === 'typescript' || language === 'tsx' || language === 'jsx';

    const getPreviewContent = () => {
        if (language === 'html') return content;
        if (language === 'svg') return content;
        // Basic wrapping for JS/TS to run in browser (very simplified)
        if (['javascript', 'typescript', 'js', 'ts'].includes(language)) {
            return `<html><body><script>${content}</script></body></html>`;
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
                flex-shrink-0 bg-white dark:bg-[#09090b] overflow-hidden flex flex-col
                ${isDesktop ? 'relative border-l border-gray-200 dark:border-white/10 h-full' : 'fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 dark:border-white/10 h-[80vh] rounded-t-2xl shadow-2xl'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-[#121212]">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                        Artifact <span className="text-gray-400">|</span> {language}
                    </h2>
                    {isPreviewable && (
                        <div className="flex bg-gray-200 dark:bg-white/10 p-0.5 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('code')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'code' ? 'bg-white dark:bg-black text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Code
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-black text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Preview
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'code' ? (
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <SyntaxHighlighter
                            language={language}
                            style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
                            customStyle={{ margin: 0, padding: '1.5rem', minHeight: '100%', fontSize: '13px' }}
                            showLineNumbers={true}
                        >
                            {content}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-white dark:bg-[#1e1e1e]">
                        <iframe 
                            key={iframeKey}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-none"
                            sandbox="allow-scripts"
                            title="Artifact Preview"
                        />
                    </div>
                )}
            </div>

            {/* Resizer */}
            {isDesktop && (
                <div onMouseDown={startResizing} className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/50 z-50 transition-colors" />
            )}
        </motion.aside>
    );
};
