/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon } from './icons';

type Source = {
  uri: string;
  title: string;
};

type SearchToolResultProps = {
  query: string;
  sources?: Source[];
};

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const SourcePill: React.FC<{ source: Source }> = ({ source }) => {
  let domain: string | null = null;
  try {
    domain = new URL(source.uri).hostname.replace('www.', '');
  } catch (error) {
    console.warn(`Invalid source URI: "${source.uri}"`);
    return null;
  }

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 dark:bg-[#4a4a4a] dark:hover:bg-[#5a5a5a] rounded-full text-sm text-gray-800 dark:text-slate-200 border border-gray-300 dark:border-slate-600/50 transition-colors"
      title={source.title}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
        alt=""
        className="w-4 h-4 flex-shrink-0"
        onError={(e) => { 
            // Hide the image and add a generic placeholder if the favicon fails to load.
            e.currentTarget.style.display = 'none';
            const placeholder = e.currentTarget.nextElementSibling?.nextElementSibling;
            if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
            }
        }}
      />
      <span className="truncate">{source.title}</span>
      {/* Fallback icon, hidden by default */}
      <div style={{ display: 'none' }} className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5 text-slate-300">
            <path d="M8.016 3.016a4.375 4.375 0 0 0-4.33 3.706c-.03.23.12.454.35.454h.01c.875 0 1.47.305 1.47 1.1c0 .795-.594 1.1-1.47 1.1h-.01c-.23 0-.38.225-.35.453a4.375 4.375 0 0 0 8.659 0c.03-.23-.12-.453-.35-.453h-.01c-.875 0-1.47-.305-1.47-1.1c0-.795.594 1.1 1.47 1.1h.01c.23 0 .38-.225.35-.454a4.375 4.375 0 0 0-4.329-3.706Z" />
        </svg>
      </div>
    </a>
  );
};

export const SearchToolResult = ({ query, sources }: SearchToolResultProps) => {
  const [showAll, setShowAll] = useState(false);
  const isLoading = sources === undefined;

  const visibleSources = showAll ? sources : sources?.slice(0, 4);
  const hiddenCount = sources ? sources.length - (visibleSources?.length ?? 0) : 0;

  return (
    <div className="bg-gray-200 dark:bg-[#3a3a3a] p-4 rounded-lg">
      {query && (
        <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-slate-200 mb-4">
          <SearchIcon />
          <p className="font-medium">
              {isLoading ? 'Searching the web for' : 'Results for'} "{query}"
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-start pl-2 h-10">
            <LoadingDots />
        </div>
      ) : (
        <>
            {sources && sources.length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                    {visibleSources?.map((source, index) => (
                    <SourcePill key={index} source={source} />
                    ))}
                    {hiddenCount > 0 && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-colors"
                    >
                        See All ({sources.length})
                    </button>
                    )}
                </div>
            ) : (
                <div className="text-sm text-slate-400">
                    No sources found.
                </div>
            )}
        </>
      )}
    </div>
  );
};