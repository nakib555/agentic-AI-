
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';
import { AttachedFilePreview } from '../Chat/MessageForm/AttachedFilePreview';
import type { ProcessedFile } from '../Chat/MessageForm/types';
import { Tooltip } from '../UI/Tooltip';

type FilesSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    files: ProcessedFile[];
    onRemoveFile: (id: string) => void;
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
    onAddFileClick: () => void;
};

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

export const FilesSidebar: React.FC<FilesSidebarProps> = ({ 
    isOpen, onClose, files, onRemoveFile, width, setWidth, isResizing, setIsResizing, onAddFileClick
}) => {
    const { isDesktop } = useViewport();

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            setWidth(Math.max(280, Math.min(newWidth, window.innerWidth * 0.5)));
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [setWidth, setIsResizing]);

    return (
        <motion.aside
            initial={false}
            animate={isOpen ? (isDesktop ? { width } : { y: 0 }) : (isDesktop ? { width: 0 } : { y: '100%' })}
            transition={{ type: isResizing ? 'tween' : 'spring', stiffness: 300, damping: 30 }}
            className={`
                flex-shrink-0 bg-white dark:bg-[#0c0c0c] overflow-hidden flex flex-col
                ${isDesktop 
                    ? 'relative border-l border-gray-200 dark:border-white/10 h-full z-30' 
                    : 'fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 dark:border-white/10 h-[70vh] rounded-t-2xl shadow-2xl'
                }
            `}
        >
            <div className="flex flex-col h-full overflow-hidden" style={{ width: isDesktop ? `${width}px` : '100%' }}>
                
                {/* Drag handle for mobile */}
                {!isDesktop && (
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0 bg-white dark:bg-[#121212]" aria-hidden="true">
                        <div className="h-1.5 w-12 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <PaperclipIcon />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">Attachments</h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Tooltip content="Add more files" position="bottom">
                            <button 
                                onClick={onAddFileClick}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <PlusIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Close sidebar" position="bottom">
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/20 custom-scrollbar">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <PaperclipIcon />
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">No files attached</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">Upload documents, images, or code to analyze.</p>
                            <button 
                                onClick={onAddFileClick}
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Add Files
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence initial={false}>
                                {files.map(file => (
                                    <motion.div
                                        key={file.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <AttachedFilePreview
                                            file={file.file}
                                            onRemove={() => onRemoveFile(file.id)}
                                            progress={file.progress}
                                            error={file.error}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
            
            {isDesktop && isOpen && (
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
