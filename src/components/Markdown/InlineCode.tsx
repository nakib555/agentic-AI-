
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// This component renders the "one quote" inline code blocks.
// It is styled to look distinct from regular text, acting as a highlight block.
export const InlineCode = ({ children }: { children?: React.ReactNode }) => {
  // Use nullish coalescing to handle 0, but fallback to empty string for null/undefined
  const content = String(children ?? '');
  return (
    <code className="bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 font-mono text-[0.9em] px-1.5 py-0.5 rounded mx-0.5 border border-gray-200 dark:border-white/10 align-middle">
      {content}
    </code>
  );
};
