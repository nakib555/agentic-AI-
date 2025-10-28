/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileIcon } from '../UI/FileIcon';

type AttachedFilePreviewProps = {
  file: File;
  onRemove: () => void;
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


export const AttachedFilePreview: React.FC<AttachedFilePreviewProps> = ({ file, onRemove }) => {
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

  const removeButton = (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${file.name}`}
      title={`Remove ${file.name}`}
      className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center bg-gray-800/60 hover:bg-gray-900/80 text-white transition-colors"
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
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-xs truncate font-medium">{file.name}</p>
          </div>
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
          {removeButton}
        </div>
      );
    case 'other':
      return (
        <div className={`${baseCardClasses} p-2 flex flex-col items-center justify-center text-center`}>
          <FileIcon filename={file.name} className="w-10 h-10 text-slate-500 dark:text-slate-400" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 break-all px-1">{file.name}</p>
          {removeButton}
        </div>
      );
  }
};