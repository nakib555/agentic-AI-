
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { FileIcon } from '../../UI/FileIcon';

const motion = motionTyped as any;

type AttachedFilePreviewProps = {
  file: File;
  onRemove: () => void;
  onPreview: () => void;
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


export const AttachedFilePreview: React.FC<AttachedFilePreviewProps> = ({ file, onRemove, onPreview, progress, error }) => {
    const isProcessing = progress < 100 && !error;
    const hasFailed = !!error;
    const { color: iconBgColor } = getFileTypeAndColor(file);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    const handleClick = () => {
        if (!hasFailed && !isProcessing) {
            onPreview();
        }
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
            onClick={handleClick}
            className={`
                relative group flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200
                ${hasFailed 
                    ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 cursor-default' 
                    : isProcessing 
                        ? 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 cursor-wait' 
                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer hover:shadow-md'
                }
            `}
            title={file.name}
        >
            {/* File Icon / Thumbnail Area */}
            <div className="relative w-full h-full p-1 overflow-hidden rounded-xl">
                {previewUrl ? (
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-black/30">
                        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className={`w-full h-full rounded-lg flex items-center justify-center ${iconBgColor} shadow-inner`}>
                        <FileIcon filename={file.name} className="w-6 h-6 text-white" />
                    </div>
                )}

                {/* Processing Overlay */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 rounded-lg backdrop-blur-[1px] flex items-center justify-center z-10"
                        >
                            <svg className="w-6 h-6 -rotate-90 transform text-white" viewBox="0 0 36 36">
                                <path
                                    className="text-white/30"
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Overlay (Desktop Hover) */}
                {!hasFailed && !isProcessing && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10 hidden lg:flex backdrop-blur-[1px]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white drop-shadow-md">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                            <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                {/* Error Overlay Icon */}
                {hasFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 rounded-lg z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-500">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Remove Button */}
            <button
                type="button"
                onClick={handleRemove}
                aria-label={`Remove ${file.name}`}
                className="absolute -top-1.5 -right-1.5 bg-white dark:bg-[#202020] text-gray-400 hover:text-white hover:bg-red-500 dark:hover:text-white dark:hover:bg-red-500 rounded-full p-0.5 border border-gray-200 dark:border-white/10 shadow-sm z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform scale-90 hover:scale-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
        </motion.div>
    );
};
