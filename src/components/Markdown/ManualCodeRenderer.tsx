
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { getMarkdownComponents } from './markdownComponents';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({ text, components: baseComponents, onRunCode, isRunDisabled }) => {
  
  // Merge dynamic components (for code running) with base styling components
  const components = useMemo(() => ({
      ...baseComponents,
      ...getMarkdownComponents({ onRunCode, isRunDisabled })
  }), [baseComponents, onRunCode, isRunDisabled]);

  // Pre-process text to handle custom syntax that standard Markdown doesn't support,
  // specifically the highlight syntax ==text== and ==[color]text==.
  // We convert these to HTML <mark> tags, which rehype-raw will parse,
  // and then our custom 'mark' component in markdownComponents.ts will handle the rendering.
  const processedText = useMemo(() => {
      if (!text) return '';
      return text
        .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
        .replace(/==(.*?)==/g, '<mark>$1</mark>');
  }, [text]);

  return (
    <div className="markdown-root">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
