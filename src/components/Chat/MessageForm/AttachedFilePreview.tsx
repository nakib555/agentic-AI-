
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

    const overlay = (
        <AnimatePresence>
            {(isProcessing || hasFailed) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center text-white bg-black/60 rounded-md backdrop-blur-[1px] z-10"
                >
                    {hasFailed ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                        </>
                    ) : (
                        <div className="w-full px-2 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold">{Math.round(progress)}%</span>
                            <div className="w-full bg-white/30 rounded-full h-1">
                                <motion.div 
                                    className="bg-white h-1 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`relative group w-full bg-white dark:bg-white/5 border ${hasFailed ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-white/5'} p-2 rounded-xl flex items-center gap-3 shadow-sm`}
        >
            {previewUrl ? (
                 <div className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/30 ring-1 ring-black/5 dark:ring-white/10">
                     <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                     {overlay}
                 </div>
            ) : (
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor} shadow-inner`}>
                    <FileIcon filename={file.name} className="w-5 h-5 text-white" />
                    {overlay}
                </div>
            )}
            
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate leading-tight ${hasFailed ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200'}`} title={file.name}>
                    {file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    {hasFailed ? (
                        <p className="text-xs text-red-500 font-medium truncate" title={error || 'Upload failed'}>
                            {error || 'Upload failed'}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{fileTypeLabel} {isProcessing && '• Uploading...'}</p>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${file.name}`}
                title={`Remove ${file.name}`}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
        </motion.div>
    );
};
