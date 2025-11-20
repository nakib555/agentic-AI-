
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';

const motion = motionTyped as any;

type UploadMenuProps = {
  menuRef: React.RefObject<HTMLDivElement>;
  onFileClick: () => void;
  onFolderClick: () => void;
};

export const UploadMenu: React.FC<UploadMenuProps> = ({ menuRef, onFileClick, onFolderClick }) => (
  <motion.div
    ref={menuRef}
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    transition={{ duration: 0.1, ease: 'easeOut' }}
    className="absolute bottom-full mb-2 w-40 bg-white dark:bg-[#2D2D2D] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-1 z-20"
  >
    <ul className="text-sm">
      <li>
        <button
          onClick={onFileClick}
          className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M4.75 2A1.75 1.75 0 0 0 3 3.75v8.5A1.75 1.75 0 0 0 4.75 14h6.5A1.75 1.75 0 0 0 13 12.25v-6.5L9.25 2H4.75ZM8.5 2.75V6H12v6.25a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-8.5a.25.25 0 0 1 .25-.25H8.5Z" /></svg>
          <span>Files</span>
        </button>
      </li>
      <li>
        <button
          onClick={onFolderClick}
          className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2 3.75C2 3.06 2.56 2.5 3.25 2.5h3.57a.75.75 0 0 1 .62.35l.38 1.12H12a1.5 1.5 0 0 1 1.5 1.5V12A1.5 1.5 0 0 1 12 13.5H4A1.5 1.5 0 0 1 2.5 12V3.75Zm1.5 0v8.25c0 .14.11.25.25.25h8a.25.25 0 0 0 .25-.25V5.47a.25.25 0 0 0-.25-.25H7.72a.75.75 0 0 1-.62-.35L6.72 3.75H3.5Z" /></svg>
          <span>Folder</span>
        </button>
      </li>
    </ul>
  </motion.div>
);
