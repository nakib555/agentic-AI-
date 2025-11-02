/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export const InlineCode = ({ children }: { children: React.ReactNode }) => {
  const content = String(children);

  // The outer `code` tag provides the code-like background and font.
  // The inner `ReactMarkdown` parses and renders styling (e.g., bold, italic) within the code.
  return (
    <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-base px-1.5 py-0.5 rounded-md mx-1">
      <ReactMarkdown
        components={{
          // Render paragraphs as fragments to avoid breaking inline layout.
          p: React.Fragment,
          // To prevent recursive styling of nested code, render it as plain text.
          code: ({ children }) => <>{String(children)}</>,
        }}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </code>
  );
};