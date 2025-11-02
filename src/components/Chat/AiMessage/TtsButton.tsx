/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const TtsButton = ({
  isPlaying,
  isLoading,
  onClick,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
}) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
    }
    if (isPlaying) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M2.5 3.5A1.5 1.5 0 0 1 4 2h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12.5v-9Z" />
        </svg>
      );
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M12.52 3.25c-.5 0-1 .17-1.39.49L6.74 7.25H5c-1.52 0-2.75 1.23-2.75 2.75v4c0 1.52 1.23 2.75 2.75 2.75h1.74l4.39 3.51c.39.31.89.49 1.39.49 1.23 0 2.23-1 2.23-2.23V5.48c0-1.23-1-2.23-2.23-2.23zM3.75 14v-4c0-.69.56-1.25 1.25-1.25h1.25v6.5H5c-.69 0-1.25-.56-1.25-1.25zm9.5 4.52a.734.734 0 0 1-1.19.57l-4.31-3.45V8.36l4.31-3.45a.734.734 0 0 1 1.19.57zM17.54 8.84c-.28-.31-.75-.33-1.06-.05s-.33.75-.05 1.06c.53.59.83 1.36.83 2.16 0 .85-.33 1.66-.92 2.27a.75.75 0 0 0 .54 1.27c.19 0 .39-.08.54-.23.87-.89 1.34-2.07 1.34-3.31 0-1.17-.43-2.29-1.21-3.16z" />
        <path d="M19.81 6.88c-.28-.31-.75-.34-1.06-.06s-.33.75-.06 1.06C19.7 9 20.25 10.47 20.25 12s-.57 3.04-1.61 4.18c-.28.31-.26.78.05 1.06.14.13.32.2.51.2.2 0 .41-.08.55-.24 1.29-1.42 2.01-3.26 2.01-5.2s-.69-3.72-1.94-5.12z" />
      </svg>
    );
  };

  const getTitle = () => {
    if (isLoading) return 'Synthesizing audio...';
    if (isPlaying) return 'Stop audio';
    return 'Listen to this message';
  };

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 self-start px-2 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-xs font-medium disabled:opacity-60 disabled:cursor-wait"
      title={getTitle()}
      disabled={isLoading}
    >
      {getButtonContent()}
    </button>
  );
};
