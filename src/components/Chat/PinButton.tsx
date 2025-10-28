/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type PinButtonProps = {
    isPinned: boolean;
    onClick: () => void;
};

export const PinButton: React.FC<PinButtonProps> = ({ isPinned, onClick }) => {
  const title = isPinned ? 'Unpin message' : 'Pin message';
  
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 self-start mt-2 px-2 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-xs font-medium"
      title={title}
      aria-pressed={isPinned}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 transition-colors ${isPinned ? 'text-yellow-500' : ''}`}>
        <path d="M6 1.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-1v2.122c1.32.263 2.5 1.01 2.5 2.128v5.25a.75.75 0 0 1-1.5 0V7.5a1.25 1.25 0 0 0-1-1.222V4.128A2.75 2.75 0 0 0 8 1.406V2.5H7A.75.75 0 0 1 6 1.75Z" />
        <path d="M3.75 6A.75.75 0 0 0 3 6.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 3.75 6ZM12.25 6a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5a.75.75 0 0 0-.75-.75Z" />
      </svg>
      <span className="hidden sm:inline">{isPinned ? 'Unpin' : 'Pin'}</span>
    </button>
  );
};