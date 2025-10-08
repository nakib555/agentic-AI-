/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';

type CalloutProps = {
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  children: React.ReactNode;
};

// Override the default `p` tag from ReactMarkdown to be a fragment.
// This prevents ReactMarkdown from wrapping the title in a <p> tag, which
// would be redundant since we are already providing a styled container.
// FIX: The `components` prop for `ReactMarkdown` expects a function component,
// not `React.Fragment` directly. This component unwraps the content from the <p> tag.
const titleComponents: Components = {
    p: ({children}) => <>{children}</>,
};

export const Callout = ({ type, title, children }: CalloutProps) => (
  <div className={`callout callout-${type}`}>
    {title && (
      <div className="callout-title">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={titleComponents}
        >
            {title.trim()}
        </ReactMarkdown>
      </div>
    )}
    <div>{children}</div>
  </div>
);
