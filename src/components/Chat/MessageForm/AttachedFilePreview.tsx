
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
    const isSuccess = progress === 100 && !error;
    
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

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
                relative group w-full p-3 rounded-2xl flex items-center gap-4 border shadow-sm transition-all
                ${hasFailed 
                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' 
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                }
            `}
        >
            {/* Thumbnail Section */}
            <div className="relative flex-shrink-0 w-14 h-14">
                 {previewUrl ? (
                     <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-black/30 ring-1 ring-black/5 dark:ring-white/10">
                         <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                     </div>
                 ) : (
                    <div className={`w-full h-full rounded-xl flex items-center justify-center ${iconBgColor} shadow-inner`}>
                        <FileIcon filename={file.name} className="w-7 h-7 text-white" />
                    </div>
                 )}
                 
                 {/* Status Badge on Thumbnail */}
                 <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-[#202123] p-0.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    {isProcessing && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
                    )}
                    {isSuccess && (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                    )}
                    {hasFailed && (
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    )}
                 </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate pr-2" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0 font-mono">{(file.size / 1024).toFixed(0)}KB</p>
                </div>
                
                {/* Progress Bar / Error Message */}
                <div className="w-full">
                    {hasFailed ? (
                        <p className="text-xs text-red-500 font-medium truncate">{error}</p>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className={`h-full rounded-full ${isSuccess ? 'bg-green-500' : 'bg-indigo-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "easeOut" }}
                                />
                            </div>
                            {isProcessing && <span className="text-[10px] font-medium text-indigo-500 w-8 text-right">{Math.round(progress)}%</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <button
                type="button"
                onClick={onRemove}
                className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all self-center"
                title="Remove file"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            </button>
        </motion.div>
    );
};
