/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileIcon } from '../../UI/FileIcon';

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
        let objectUrl: string | null = null;
        if (file.type.startsWith('image/')) {
            objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file]);

    const overlay = (
        <AnimatePresence>
            {(isProcessing || hasFailed) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white bg-black/70 rounded-md"
                >
                    {hasFailed ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                            <p className="text-xs font-bold mt-1">Upload Failed</p>
                        </>
                    ) : (
                        <>
                            <div className="w-full max-w-[80%] bg-gray-500 rounded-full h-1">
                                <motion.div 
                                    className="bg-blue-500 h-1 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                />
                            </div>
                            <p className="text-white text-xs font-semibold mt-1.5">{progress}%</p>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative group w-full bg-black/5 dark:bg-white/5 p-2 rounded-lg flex items-center gap-3">
            {previewUrl ? (
                 <div className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-300 dark:bg-black/30">
                     <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                     {overlay}
                 </div>
            ) : (
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${iconBgColor}`}>
                    <FileIcon filename={file.name} className="w-6 h-6 text-white" />
                    {overlay}
                </div>
            )}
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{fileTypeLabel}</p>
            </div>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${file.name}`}
                title={`Remove ${file.name}`}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-300/50 dark:bg-black/30 hover:bg-gray-400/50 dark:hover:bg-black/50 text-gray-700 dark:text-slate-200 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
            </button>
        </div>
    );
};