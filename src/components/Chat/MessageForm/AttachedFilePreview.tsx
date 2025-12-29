
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { FileIcon } from '../../UI/FileIcon';
import { FilePreviewModal } from './FilePreviewModal';

const motion = motionTyped as any;

type AttachedFilePreviewProps = {
  file: File;
  onRemove: () => void;
  progress: number; // 0-100
  error: string | null;
};

const getFileTypeAndColor = (file: File): { type: string; color: string } => {
    const mime = file.type;
    const name = file.name.toLowerCase();

    if (mime.startsWith('image/')) return { type: 'Image', color: 'bg-blue-500' };
    if (mime.startsWith('video/')) return { type: 'Video', color: 'bg-purple-500' };
    if (mime.startsWith('audio/')) return { type: 'Audio', color: 'bg-orange-500' };
    if (mime === 'application/pdf') return { type: 'PDF', color: 'bg-red-500' };
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z') || name.endsWith('.tar') || name.endsWith('.gz')) return { type: 'Archive', color: 'bg-yellow-600' };

    const codeExtensions = ['.js', '.ts', '.html', '.css', '.json', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.sh', '.rb', '.swift', '.sql', '.xml'];
    if (codeExtensions.some(ext => name.endsWith(ext))) return { type: 'Code', color: 'bg-gray-600' };
    
    return { type: 'File', color: 'bg-gray-500' };
};


export const AttachedFilePreview: React.FC<AttachedFilePreviewProps> = ({ file, onRemove, progress, error }) => {
    const isProcessing = progress < 100 && !error;
    const hasFailed = !!error;
    const { type: fileTypeLabel, color: iconBgColor } = getFileTypeAndColor(file);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        // If it's not an image file, ensure we clear any existing preview URL.
        if (!file.type.startsWith('image/')) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Return a cleanup function to revoke the object URL when the component
        // unmounts or the file prop changes, preventing memory leaks.
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove();
    };

    const handlePreview = () => {
        if (!hasFailed && !isProcessing) {
            setIsPreviewOpen(true);
        }
    };

    return (
        <>
            <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                onClick={handlePreview}
                className={`
                    relative group w-full p-2 rounded-xl flex items-center gap-3 shadow-sm transition-all duration-200
                    ${hasFailed 
                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 cursor-default' 
                        : isProcessing 
                            ? 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 cursor-wait' 
                            : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer hover:shadow-md'
                    }
                `}
            >
                {/* File Icon / Thumbnail Area */}
                <div className="relative flex-shrink-0 w-12 h-12">
                    {previewUrl ? (
                        <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-black/30 ring-1 ring-black/5 dark:ring-white/10">
                            <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-full h-full rounded-lg flex items-center justify-center ${iconBgColor} shadow-inner`}>
                            <FileIcon filename={file.name} className="w-6 h-6 text-white" />
                        </div>
                    )}

                    {/* Enhanced Upload Progress Overlay */}
                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 rounded-lg backdrop-blur-[1px] flex items-center justify-center"
                            >
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-400/50"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <motion.path
                                            className="text-white drop-shadow-md"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeDasharray="100, 100"
                                            initial={{ strokeDashoffset: 100 }}
                                            animate={{ strokeDashoffset: 100 - progress }}
                                        />
                                    </svg>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Overlay Icon */}
                    {hasFailed && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1e1e1e]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </div>
                    )}
                </div>
                
                {/* File Details */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate leading-tight ${hasFailed ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-slate-200'}`} title={file.name}>
                        {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {hasFailed ? (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                    <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate" title={error || 'Upload failed'}>{error || 'Upload failed'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                    {isProcessing ? 'Uploading...' : `${(file.size / 1024).toFixed(1)} KB`}
                                </p>
                                {isProcessing && (
                                    <div className="flex-1 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-indigo-500 rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.1, ease: 'linear' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Remove Button */}
                <button
                    type="button"
                    onClick={handleRemove}
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
            </motion.div>

            <FilePreviewModal 
                file={file} 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
            />
        </>
    );
};
