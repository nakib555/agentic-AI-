
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type InlineCodeProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

// This component renders the "one quote" (single backtick) inline code blocks.
// It is styled to look distinct from regular text, acting as a highlight block.
// It now supports arbitrary children (allowing rich text if passed) and merging of classes.
export const InlineCode: React.FC<InlineCodeProps> = ({ children, className = '', ...props }) => {
  return (
    <code 
      className={`
        font-mono 
        text-[0.875em] 
        px-1.5 
        py-0.5 
        rounded-md 
        mx-0.5 
        bg-indigo-50 dark:bg-indigo-500/15 
        text-indigo-700 dark:text-indigo-200 
        border border-indigo-200/50 dark:border-indigo-500/20 
        align-baseline
        font-medium
        inline-block
        break-words
        ${className}
      `}
      {...props}
    >
      {children}
    </code>
  );
};
