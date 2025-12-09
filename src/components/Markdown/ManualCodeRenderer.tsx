
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

// Robust function to protect code blocks from highlight replacement
// This prevents "==" equality operators in code from being converted to <mark> tags
const processHighlights = (content: string): string => {
    if (!content) return '';
    
    // Split content by code blocks (triple backtick) and inline code (single backtick)
    // We capture the delimiters so we can reconstruct the string
    // This regex matches:
    // 1. ``` ... ``` (Multi-line code blocks)
    // 2. ` ... ` (Inline code)
    const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g);
    
    return parts.map(part => {
        // If this part is a code block, return it untouched
        if (part.startsWith('`')) return part;
        
        // Apply highlight replacement only to non-code text
        // Converts ==[color]text== or ==text== to HTML <mark> tags
        return part
            .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
            .replace(/==(.*?)==/g, '<mark>$1</mark>');
    }).join('');
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

  // Preprocess highlights to HTML <mark> tags safely
  const processedText = useMemo(() => {
    return processHighlights(text);
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
