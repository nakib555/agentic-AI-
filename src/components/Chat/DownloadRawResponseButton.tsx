/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type DownloadRawResponseButtonProps = {
  rawText: string;
};

export const DownloadRawResponseButton: React.FC<DownloadRawResponseButtonProps> = ({ rawText }) => {
  const handleDownload = () => {
    // 1. Create a blob from the raw text
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    
    // 2. Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // 3. Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    // Use a timestamp for a unique filename, replacing invalid characters
    link.download = `ai-response-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    
    // 4. Programmatically click the link to trigger the download
    document.body.appendChild(link);
    link.click();
    
    // 5. Clean up by removing the link and revoking the URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="group flex items-center gap-2 self-start mt-2 px-2 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-xs font-medium"
      title="Download raw AI response"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform group-hover:scale-110">
        <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L9.25 8.44V2.75Z" />
        <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
      </svg>
      <span className="hidden sm:inline">Download Response</span>
    </button>
  );
};