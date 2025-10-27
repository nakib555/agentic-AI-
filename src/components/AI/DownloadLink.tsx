/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fileStore } from '../../services/fileStore';

type DownloadLinkProps = {
  filename: string;
  fileKey: string;
};

export const DownloadLink: React.FC<DownloadLinkProps> = ({ filename, fileKey }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    
    const loadFile = async () => {
        try {
            const blob = await fileStore.getFile(fileKey);
            if (blob) {
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            } else {
                setError('File not found in local storage.');
            }
        } catch (err) {
            console.error('Failed to load file for download:', err);
            setError('Failed to load file.');
        }
    };

    loadFile();

    return () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [fileKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-4"
    >
      <a
        href={url ?? '#'}
        download={filename}
        className={`group inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            !url || error 
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
        }`}
        title={error ? error : (url ? `Download ${filename}` : 'Loading file...')}
        onClick={(e) => { if (!url || error) e.preventDefault(); }}
      >
        <div className="flex-shrink-0 text-gray-500 dark:text-slate-400">
            { !url && !error ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <span className="block font-medium">{error ? 'Download Unavailable' : 'Download File'}</span>
            <span className="block text-xs text-gray-500 dark:text-slate-400 truncate">{error || filename}</span>
        </div>
      </a>
    </motion.div>
  );
};
