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
import 'katex/dist/katex.min.css';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({
  text,
  components: baseComponents,
  onRunCode,
  isRunDisabled,
}) => {
  const mergedComponents = useMemo(
    () => ({
      ...baseComponents,
      ...getMarkdownComponents({ onRunCode, isRunDisabled }),
    }),
    [baseComponents, onRunCode, isRunDisabled]
  );

  // Preprocess highlights to HTML <mark> tags
  // Markdown parsers usually ignore custom syntax like ==text==, so we pre-convert to HTML
  // and use rehype-raw to parse the HTML.
  const processedText = useMemo(() => {
    if (!text) return '';
    return text
      .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>');
  }, [text]);

  return (
    <div className="markdown-root">
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={mergedComponents}
        >
            {processedText}
        </ReactMarkdown>
    </div>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);