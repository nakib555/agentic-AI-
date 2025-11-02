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
  return (
    <a
      href={href}
      target="_blank" // Open in a new tab
      rel="noopener noreferrer" // Security measure
      className="text-primary font-medium hover:text-primary-focus underline decoration-primary/40 hover:decoration-primary/60 decoration-wavy underline-offset-4 transition-colors"
      title={`Opens external link: ${href}`}
    >
      {children}
    </a>
  );
};