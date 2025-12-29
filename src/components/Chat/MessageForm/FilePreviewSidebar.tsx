
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '../../../hooks/useViewport';
import { AttachedFilePreview } from './AttachedFilePreview';
import type { ProcessedFile } from './types';

type FilePreviewSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    files: ProcessedFile[];
    onRemove: (id: string) => void;
};

export const FilePreviewSidebar: React.FC<FilePreviewSidebarProps> = ({ 
    isOpen, 
    onClose, 
    files, 
    onRemove 
}) => {
    const { isDesktop } = useViewport();

    // Do not render anything if no files (auto-close logic usually handles this, but safety check)
    // We keep it rendered for AnimatePresence exit animations though.

    const desktopVariants = {
        closed: { x: '100%', opacity: 0 },
        open: { x: 0, opacity: 1 }
    };

    const mobileVariants = {
        closed: { scale: 0.9, opacity: 0, y: 20 },
        open: { scale: 1, opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for Mobile */}
                    {!isDesktop && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                    )}

                    {/* Container */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={isDesktop ? desktopVariants : mobileVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`
                            fixed z-[70] bg-white dark:bg-[#121212] border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden
                            ${isDesktop 
                                ? 'top-0 right-0 h-full w-80 border-l' 
                                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[70vh] rounded-2xl border'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Attached Files</h3>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-[#09090b]">
                            <AnimatePresence initial={false} mode='popLayout'>
                                {files.map(file => (
                                    <motion.div
                                        key={file.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                    >
                                        <AttachedFilePreview
                                            file={file.file}
                                            onRemove={() => onRemove(file.id)}
                                            progress={file.progress}
                                            error={file.error}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {files.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No files attached</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (Mobile only close hint or actions) */}
                        {!isDesktop && (
                            <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] flex justify-end">
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
