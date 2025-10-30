/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileIcon } from '../UI/FileIcon';

type AttachedFilePreviewProps = {
  file: File;
  onRemove: () => void;
  progress: number; // 0-100
  error: string | null;
};

// A list of MIME types and common text file extensions to identify files for preview
const TEXT_MIME_TYPES = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-python-code',
];
const TEXT_EXTENSIONS = ['.py', '.js', '.ts', '.css', '.html', '.md', '.log', '.rtf', '.csv', '.json', '.xml', '.txt'];

const isTextFile = (file: File): boolean => {
    return TEXT_MIME_TYPES.some(type => file.type.startsWith(type)) || TEXT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};


export const AttachedFilePreview: React.FC<AttachedFilePreviewProps> = ({ file, onRemove, progress, error }) => {
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'text' | 'other'>('other');

  useEffect(() => {
    let objectUrl: string | null = null;
    const processFile = async () => {
      if (file.type.startsWith('image/')) {
        setFileType('image');
        objectUrl = URL.createObjectURL(file);
        setPreviewData(objectUrl);
      } else if (isTextFile(file)) {
        setFileType('text');
        try {
          // Read the first 1KB for preview
          const text = await file.slice(0, 1024).text();
          setPreviewData(text);
        } catch (e) {
          console.error("Failed to read file preview", e);
          setPreviewData("[Could not read file content]");
        }
      } else {
        setFileType('other');
        setPreviewData(null);
      }
    };
    processFile();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file]);
  
  const isProcessing = progress < 100 && !error;
  const hasFailed = !!error;

  const overlay = (
    <AnimatePresence>
      {(isProcessing || hasFailed) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white z-20"
        >
          {hasFailed ? (
            <div className="absolute inset-0 bg-red-800/80 flex flex-col items-center justify-center p-2 text-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
              <p className="text-xs font-bold mt-1">Upload Failed</p>
              <p className="text-xs mt-1 truncate" title={error}>{error}</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-2">
              <div className="w-full max-w-[80%] bg-gray-600 rounded-full h-1.5">
                <motion.div 
                  className="bg-blue-500 h-1.5 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: 'linear' }}
                />
              </div>
              <p className="text-white text-xs font-semibold mt-2">{progress}%</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const removeButton = (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${file.name}`}
      title={`Remove ${file.name}`}
      className="absolute top-1.5 right-1.5 z-30 w-5 h-5 rounded-full flex items-center justify-center bg-gray-800/60 hover:bg-gray-900/80 text-white transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
    </button>
  );

  const baseCardClasses = "relative group w-full aspect-video bg-slate-200 dark:bg-slate-700/80 rounded-lg overflow-hidden";

  switch (fileType) {
    case 'image':
      return (
        <div className={baseCardClasses}>
          {previewData ? <img src={previewData} alt={file.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileIcon filename={file.name} className="w-8 h-8 text-slate-500" /></div>}
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent z-10">
            <p className="text-white text-xs truncate font-medium">{file.name}</p>
          </div>
          {overlay}
          {removeButton}
        </div>
      );
    case 'text':
      return (
        <div className={`${baseCardClasses} flex flex-col p-2`}>
          <div className="flex items-center gap-2 min-w-0 pr-6">
            <FileIcon filename={file.name} className="flex-shrink-0 w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="truncate flex-1 min-w-0 font-medium text-sm text-slate-700 dark:text-slate-200" title={file.name}>{file.name}</span>
          </div>
          <pre className="mt-1.5 text-xs bg-slate-100 dark:bg-black/20 p-2 rounded-md max-h-full overflow-y-auto relative font-mono text-slate-600 dark:text-slate-300 flex-1">
            <code>{previewData || 'Loading preview...'}</code>
            {previewData && <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-100 dark:from-black/20 to-transparent" />}
          </pre>
          {overlay}
          {removeButton}
        </div>
      );
    case 'other':
      return (
        <div className={`${baseCardClasses} p-2 flex flex-col items-center justify-center text-center`}>
          <FileIcon filename={file.name} className="w-10 h-10 text-slate-500 dark:text-slate-400" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 break-all px-1">{file.name}</p>
          {overlay}
          {removeButton}
        </div>
      );
  }
};