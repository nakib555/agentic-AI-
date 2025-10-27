/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fileStore } from '../../services/fileStore';
import { FileIcon } from '../UI/FileIcon';


type FileAttachmentProps = {
  filename: string;
  fileKey: string;
  mimeType: string;
};

const PREVIEWABLE_MIMETYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'application/pdf', 'text/html'];

export const FileAttachment: React.FC<FileAttachmentProps> = ({ filename, fileKey, mimeType }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPreviewable = PREVIEWABLE_MIMETYPES.includes(mimeType);

  useEffect(() => {
    let url: string | null = null;
    const loadFile = async () => {
      try {
        const blob = await fileStore.getFile(fileKey);
        if (blob) {
          url = URL.createObjectURL(blob);
          setObjectUrl(url);
        } else {
          setError('File not found in local storage.');
        }
      } catch (err) {
        setError('Failed to load file for preview.');
        console.error('Failed to load file from fileStore:', err);
      }
    };
    loadFile();
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileKey]);

  const handleDownload = () => {
    if (!objectUrl) return;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreviewContent = () => {
    if (error) {
      return <p className="p-4 text-sm text-red-500 dark:text-red-400">{error}</p>;
    }
    if (!objectUrl) {
      return (
        <div className="text-sm text-slate-400 p-4 text-center">
            <div className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Loading preview...</span>
            </div>
        </div>
      );
    }
    if (mimeType.startsWith('image/')) {
      return <img src={objectUrl} alt={filename} className="max-h-[60vh] w-auto h-auto object-contain" />;
    }
    if (mimeType === 'application/pdf' || mimeType === 'text/html') {
        // Use iframe for native browser rendering of PDFs and HTML
        return <iframe src={objectUrl} sandbox="allow-scripts" className="w-full h-[60vh] border-none bg-white" title={filename} />;
    }
    // This case shouldn't be reached if isPreviewable is correct, but as a fallback:
    return <p className="p-4 text-sm text-slate-400">No preview available for this file type.</p>;
  };

  if (isPreviewable) {
    return (
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-lg bg-white dark:bg-[#1e1e1e]"
      >
          <div className="bg-gray-50 dark:bg-black/20 flex items-center justify-center">
              {renderPreviewContent()}
          </div>
          <div className="p-3 bg-white dark:bg-[#202123]/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate" title={filename}>{filename}</span>
              <button
                  onClick={handleDownload}
                  disabled={!objectUrl || !!error}
                  className="flex-shrink-0 p-1.5 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Download ${filename}`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  <span className="sr-only">Download</span>
              </button>
          </div>
      </motion.div>
    );
  }

  // Fallback to DownloadLink UI for non-previewable files
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-4"
    >
      <a
        href={objectUrl ?? '#'}
        download={filename}
        className={`group inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
            !objectUrl || error 
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
        }`}
        title={error ? error : (objectUrl ? `Download ${filename}` : 'Loading file...')}
        onClick={(e) => { if (!objectUrl || error) e.preventDefault(); }}
      >
        <div className="flex-shrink-0 text-gray-500 dark:text-slate-400">
            { !objectUrl && !error ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
                <FileIcon filename={filename} className="w-5 h-5" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <span className="block font-medium">{error ? 'Unavailable' : filename}</span>
            <span className="block text-xs text-gray-500 dark:text-slate-400">{error || 'Click to download'}</span>
        </div>
      </a>
    </motion.div>
  );
};