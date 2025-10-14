
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileIcon } from '../UI/FileIcon';

type AttachedFilePreviewProps = {
  file: File;
  onRemove: () => void;
};

export const AttachedFilePreview: React.FC<AttachedFilePreviewProps> = ({ file, onRemove }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700/80 px-2 py-1.5 rounded-full w-full max-w-full">
        <FileIcon filename={file.name} className="flex-shrink-0 w-4 h-4" />
        <span className="truncate flex-1 min-w-0" title={file.name}>{file.name}</span>
        <button 
            type="button" 
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            title={`Remove ${file.name}`}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-400/50 hover:bg-slate-500/50 text-white transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
        </button>
    </div>
  );
};
