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
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700/80 transition-colors rounded-lg text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 mt-2"
      title="Download raw AI response"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
      <span>Download Raw Response</span>
    </button>
  );
};
