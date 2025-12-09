
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
const processHighlights = (content: string): string => {
    if (!content) return '';
    
    // FAST PATH: If no "==" exists, skip the expensive regex split entirely.
    if (!content.includes('==')) return content;
    
    // Split content by code blocks, inline code, display math, and inline math
    const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
    
    return parts.map(part => {
        // If this part is a code block or math, return it untouched
        if (part.startsWith('`') || part.startsWith('$')) return part;
        
        // Apply highlight replacement only to regular text
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
  // Memoize components object creation to prevent ReactMarkdown re-instantiation
  const mergedComponents = useMemo(
    () => ({
      ...baseComponents,
      ...getMarkdownComponents({ onRunCode, isRunDisabled }),
    }),
    [baseComponents, onRunCode, isRunDisabled]
  );

  // Heavy regex parsing should be memoized based on the text input
  const processedText = useMemo(() => {
    return processHighlights(text);
  }, [text]);

  return (
    <div className="markdown-root">
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={mergedComponents}
        >
            {processedText}
        </ReactMarkdown>
    </div>
  );
};

// Strict memoization: Only re-render if text length changes significantly or is done streaming
// This allows the typewriter effect to flow without full Markdown re-parsing on every character
export const ManualCodeRenderer = memo(ManualCodeRendererRaw, (prev, next) => {
    // Always re-render if streaming state changes
    if (prev.isStreaming !== next.isStreaming) return false;
    // Always re-render if run handler changes
    if (prev.onRunCode !== next.onRunCode) return false;
    // If we are not streaming, simple equality check
    if (!next.isStreaming) return prev.text === next.text;
    
    // DURING STREAMING OPTIMIZATION:
    // If the text is just getting longer, ReactMarkdown is heavy.
    // We let it re-render, but the internal useMemo above saves the parsing cost 
    // if the text chunk didn't change the structure significantly. 
    // However, purely blocking re-renders based on length chunks (e.g. every 50 chars) 
    // can cause visual stutter. The best optimization is the useMemo inside the component.
    return prev.text === next.text;
});
