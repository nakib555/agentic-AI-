
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// This component renders the "one quote" (single backtick) inline code blocks.
// It is styled to look distinct from regular text, acting as a highlight block.
export const InlineCode = ({ children }: { children?: React.ReactNode }) => {
  return (
    <code className="bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-gray-100 font-mono text-[0.9em] px-1.5 py-0.5 rounded mx-0.5 border border-gray-300 dark:border-white/20 align-middle font-medium">
      {children}
    </code>
  );
};
