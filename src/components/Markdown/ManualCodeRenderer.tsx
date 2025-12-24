/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, memo, useMemo, ReactNode } from 'react';
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

// Robust function to protect code blocks AND math from highlight replacement.
const processHighlights = (content: string): string => {
    if (!content) return '';
    
    // Check if we need processing at all
    const hasHighlight = content.includes('==');
    const hasCurrency = content.includes('$');
    
    if (!hasHighlight && !hasCurrency) return content;
    
    // Split content by code blocks, inline code, display math, and inline math to protect them
    // Note: The regex `\$[^$\n]+\$` captures valid inline math (single line).
    const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
    
    return parts.map(part => {
        // If this part is a code block or math, return it untouched
        if (part.startsWith('`') || part.startsWith('$')) return part;
        
        // Apply text transformations to regular text segments
        return part
            // Match specific color syntax: ==[red] text==
            .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
            // Match standard highlight: ==text==
            .replace(/==(.*?)==/g, '<mark>$1</mark>')
            // Escape currency symbols ($ followed by digit) to prevent KaTeX from mistaking them for open math tags
            // This prevents "stuck" rendering when the model writes "$100" without a closing $.
            .replace(/\$(\d)/g, '\\$$$1');
    }).join('');
};

interface MarkdownErrorBoundaryProps {
  children?: ReactNode;
  fallback: ReactNode;
  text: string;
}

interface MarkdownErrorBoundaryState {
  hasError: boolean;
}

// Internal Error Boundary to catch Markdown/Rehype parsing crashes during streaming
class MarkdownErrorBoundary extends Component<MarkdownErrorBoundaryProps, MarkdownErrorBoundaryState> {
  public state: MarkdownErrorBoundaryState = { hasError: false };

  constructor(props: MarkdownErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    // console.warn("Markdown parsing error caught:", error);
    return { hasError: true };
  }

  componentDidUpdate(prevProps: MarkdownErrorBoundaryProps) {
    // If the text input has changed, try to recover. 
    // The stream likely added more tokens that fixed the malformed syntax.
    if (prevProps.text !== this.props.text && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

  const processedText = useMemo(() => {
    return processHighlights(text);
  }, [text]);

  return (
    <div className="markdown-content">
        <MarkdownErrorBoundary
            text={processedText}
            fallback={
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                    {processedText}
                </div>
            }
        >
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={mergedComponents}
            >
                {processedText}
            </ReactMarkdown>
        </MarkdownErrorBoundary>
    </div>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw, (prev, next) => {
    if (prev.isStreaming !== next.isStreaming) return false;
    if (prev.onRunCode !== next.onRunCode) return false;
    if (!next.isStreaming) return prev.text === next.text;
    
    // Optimize streaming re-renders
    return prev.text === next.text;
});