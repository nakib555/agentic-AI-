/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { MarkdownComponents } from '../Markdown/markdownComponents';

type Source = {
  uri: string;
  title: string;
};

type GoogleSearchResultsProps = {
  query: string;
  summary: string;
  sources: Source[];
};

const SourcePill: React.FC<{ source: Source }> = ({ source }) => {
  let domain: string | null = null;
  try {
    // A malformed or relative URI will throw an error here, which we need to catch.
    domain = new URL(source.uri).hostname;
  } catch (error) {
    console.warn(`Invalid source URI encountered: "${source.uri}"`);
    // If the URL is invalid, we proceed without a domain to prevent a crash.
  }

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
      title={`Visit source: ${source.title}`}
    >
      {domain && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
          alt=""
          className="w-4 h-4 rounded-sm"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <span className="truncate">{source.title}</span>
    </a>
  );
};

export const GoogleSearchResults = ({ query, summary, sources }: GoogleSearchResultsProps) => {
  return (
    <div className="my-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800/50">
      {/* Search Bar Display */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-800 dark:text-slate-200">{query}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="p-4 markdown-content max-w-full">
        <ManualCodeRenderer text={summary} components={MarkdownComponents} />
      </div>

      {/* Sources Section */}
      {sources && sources.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Sources</h4>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <SourcePill key={index} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};