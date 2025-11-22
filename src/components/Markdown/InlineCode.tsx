/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// The previous implementation used ReactMarkdown recursively, which caused a runtime error.
// Standard markdown doesn't support nested markdown within inline code.
// This simplified version renders the content as plain text within a `<code>` tag,
// which fixes the error and adheres to markdown standards.
export const InlineCode = ({ children }: { children?: React.ReactNode }) => {
  const content = String(children || '');
  return (
    <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm px-1.5 py-0.5 rounded-md mx-0.5">
      {content}
    </code>
  );
};