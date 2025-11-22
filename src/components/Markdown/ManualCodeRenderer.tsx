
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { getMarkdownComponents } from './markdownComponents';

type ManualCodeRendererProps = {
  text: string;
  components?: any;
  isStreaming?: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({ text, components: baseComponents, onRunCode, isRunDisabled }) => {
  
  const components = useMemo(() => ({
      ...getMarkdownComponents({ onRunCode, isRunDisabled }),
      ...baseComponents
  }), [baseComponents, onRunCode, isRunDisabled]);

  // Pre-process text to support the custom ==highlight== and ==[color]highlight== syntax
  // by converting them to HTML <mark> tags, which rehype-raw will handle.
  // We do this because standard markdown doesn't support this syntax.
  const processedText = useMemo(() => {
      if (!text) return '';
      return text
          // Colored highlights: ==[red]text== -> <mark>[red]text</mark>
          // The StyledMark component will handle parsing the [color] part from the children
          .replace(/==\[([a-zA-Z]+)\](.*?)==/g, (match, color, content) => {
              return `<mark>[${color}]${content}</mark>`;
          })
          // Standard highlights: ==text== -> <mark>text</mark>
          .replace(/==(.*?)==/g, '<mark>$1</mark>');
  }, [text]);

  return (
    <div className="markdown-root">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
