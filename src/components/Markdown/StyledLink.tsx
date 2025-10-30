/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type StyledLinkProps = {
  href?: string;
  children: React.ReactNode;
};

export const StyledLink: React.FC<StyledLinkProps> = ({ href, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href) {
      // Use window.confirm to ask for user confirmation
      const isConfirmed = window.confirm(`Are you sure you want to open this external link?\n\n${href}`);
      if (!isConfirmed) {
        e.preventDefault(); // Prevent navigation if the user cancels
      }
    }
  };

  return (
    <a
      href={href}
      target="_blank" // Open in a new tab
      rel="noopener noreferrer" // Security measure
      onClick={handleClick}
      className="text-blue-500 dark:text-blue-400 font-medium hover:text-blue-600 dark:hover:text-blue-300 underline decoration-blue-500/40 hover:decoration-blue-600/60 dark:decoration-blue-400/40 dark:hover:decoration-blue-300/60 decoration-wavy underline-offset-4 transition-colors"
      title={`Opens external link: ${href}`}
    >
      {children}
    </a>
  );
};