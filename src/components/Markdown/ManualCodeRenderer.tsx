
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
// We import local CSS as well, though index.html CDN is primary fallback
import 'katex/dist/katex.min.css';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

// Robust function to protect code blocks AND math from highlight replacement.
// This prevents "==" or other sequences inside math/code from being converted to <mark> tags.
const processHighlights = (content: string): string => {
    if (!content) return '';
    
    // FAST PATH: If no "==" exists, skip the expensive regex split entirely.
    if (!content.includes('==')) return content;
    
    // Split content by:
    // 1. ``` ... ``` (Multi-line code blocks)
    // 2. ` ... ` (Inline code)
    // 3. $$ ... $$ (Display math) - Captures multi-line math blocks
    // 4. $ ... $ (Inline math) - Captures single line math (excludes newlines to avoid false positives)
    const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
    
    return parts.map(part => {
        // If this part is a code block or math, return it untouched
        if (part.startsWith('`') || part.startsWith('$')) return part;
        
        // Apply highlight replacement only to regular text
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
            // Important: rehypeKatex must run BEFORE rehypeRaw to ensure math nodes 
            // are transformed into HTML before raw HTML processing occurs.
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={mergedComponents}
        >
            {processedText}
        </ReactMarkdown>
    </div>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
