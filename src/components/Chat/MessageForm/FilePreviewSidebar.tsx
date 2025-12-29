
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '../../../hooks/useViewport';
import type { ProcessedFile } from './types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../../hooks/useTheme';

type FilePreviewSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    file: ProcessedFile | null;
};

export const FilePreviewSidebar: React.FC<FilePreviewSidebarProps> = ({ 
    isOpen, 
    onClose, 
    file 
}) => {
    const { isDesktop } = useViewport();
    const { theme } = useTheme();
    const [content, setContent] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'text' | 'pdf' | 'other'>('other');

    useEffect(() => {
        if (!file || !file.file) {
            setContent(null);
            return;
        }

        const rawFile = file.file;

        if (rawFile.type.startsWith('image/')) {
            setPreviewType('image');
            if (file.base64Data) {
                setContent(`data:${rawFile.type};base64,${file.base64Data}`);
            } else {
                const url = URL.createObjectURL(rawFile);
                setContent(url);
                return () => URL.revokeObjectURL(url);
            }
            return;
        }

        if (rawFile.type === 'application/pdf') {
            setPreviewType('pdf');
            const url = URL.createObjectURL(rawFile);
            setContent(url);
            return () => URL.revokeObjectURL(url);
        }

        if (
            rawFile.type.startsWith('text/') || 
            rawFile.name.match(/\.(json|js|jsx|ts|tsx|css|html|md|py|rb|java|c|cpp|h|txt|csv|xml|yaml|yml|log|env|ini|conf)$/i)
        ) {
            setPreviewType('text');
            if (file.base64Data) {
                try {
                    const decoded = new TextDecoder().decode(
                        Uint8Array.from(atob(file.base64Data), c => c.charCodeAt(0))
                    );
                    setContent(decoded);
                } catch (e) {
                    setContent('Error decoding text content.');
                }
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result;
                    if (typeof result === 'string') setContent(result);
                };
                reader.readAsText(rawFile);
            }
            return;
        }

        setPreviewType('other');
    }, [file]);

    const isDarkMode = theme === 'dark' || theme === 'spocke' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const desktopVariants = {
        closed: { x: '100%', opacity: 0 },
        open: { x: 0, opacity: 1 }
    };

    // Updated mobile variants for bottom-sheet animation
    const mobileVariants = {
        closed: { y: '100%', opacity: 0 },
        open: { y: 0, opacity: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && file && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] ${isDesktop ? 'bg-black/30' : ''}`}
                    />

                    {/* Container */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={isDesktop ? desktopVariants : mobileVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`
                            fixed z-[70] bg-page border-border-subtle shadow-2xl flex flex-col overflow-hidden
                            ${isDesktop 
                                ? 'top-0 right-0 h-full w-[500px] max-w-[90vw] border-l' 
                                : 'bottom-0 left-0 right-0 h-[80vh] w-full rounded-t-2xl border-t'
                            }
                        `}
                    >
                        {/* Drag Handle for Mobile */}
                        {!isDesktop && (
                            <div className="flex justify-center pt-3 pb-1 bg-layer-2 flex-shrink-0 cursor-pointer" onClick={onClose}>
                                <div className="w-12 h-1.5 rounded-full bg-border-strong"></div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-layer-2 flex-shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-1.5 bg-primary-subtle rounded-lg text-primary-main flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <line x1="10" y1="9" x2="8" y2="9"></line>
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-sm font-bold text-content-primary truncate" title={file.file.name}>{file.file.name}</h3>
                                    <p className="text-[10px] font-medium text-content-secondary">
                                        {(file.file.size / 1024).toFixed(1)} KB • {file.file.type || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-layer-3 transition-colors flex-shrink-0"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Content Viewer */}
                        <div className="flex-1 overflow-auto p-4 bg-page flex items-center justify-center relative">
                            {previewType === 'image' && content && (
                                <img src={content} alt={file.file.name} className="max-w-full max-h-full object-contain rounded shadow-sm" />
                            )}
                            
                            {previewType === 'pdf' && content && (
                                <iframe src={content} title={file.file.name} className="w-full h-full min-h-[600px] rounded border-none bg-white" />
                            )}

                            {previewType === 'text' && content && (
                                <div className="w-full h-full bg-layer-1 rounded border border-border-default overflow-hidden text-sm shadow-sm absolute inset-0 m-4">
                                    <SyntaxHighlighter
                                        language="text"
                                        style={isDarkMode ? vscDarkPlus : oneLight}
                                        customStyle={{ margin: 0, padding: '1.5rem', height: '100%', fontSize: '13px', backgroundColor: 'transparent' }}
                                        wrapLongLines={true}
                                    >
                                        {content}
                                    </SyntaxHighlighter>
                                </div>
                            )}

                            {previewType === 'other' && (
                                <div className="text-center text-content-secondary flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <p>No preview available for this file type.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
