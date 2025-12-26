
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo, ReactNode, Component } from 'react';
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
    // Note: the regex `\$[^$\n]+\$` captures valid inline math (single line).
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
// Fix: Inherit from Component to ensure type definitions for props and state are correctly inherited
class MarkdownErrorBoundary extends Component<MarkdownErrorBoundaryProps, MarkdownErrorBoundaryState> {
  // Fix: Explicitly initialize state at class level to avoid property not found errors
  public state: MarkdownErrorBoundaryState = { hasError: false };

  constructor(props: MarkdownErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(_: any): MarkdownErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: MarkdownErrorBoundaryProps) {
    // If the text input has changed, try to recover. 
    // The stream likely added more tokens that fixed the malformed syntax.
    // Fix: Access this.props and this.state which are now correctly inherited from Component
    if (prevProps.text !== this.props.text && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    // Fix: Access this.state and this.props which are now correctly inherited from Component
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const ManualCodeRenderer = memo(({ text, components, isStreaming, onRunCode, isRunDisabled }: ManualCodeRendererProps) => {
    // 1. Process custom syntax (highlights) before markdown parsing
    // We memoize this to avoid regex overhead on every render if text hasn't changed
    const processedText = useMemo(() => processHighlights(text), [text]);

    // 2. Prepare components with handlers
    // We merge the static components map with any dynamic handlers (like onRunCode)
    // The `getMarkdownComponents` factory handles the binding.
    const mergedComponents = useMemo(() => {
        if (!onRunCode && !isRunDisabled) return components;
        
        // Re-create components with context if we have actions
        return getMarkdownComponents({ onRunCode, isRunDisabled });
    }, [components, onRunCode, isRunDisabled]);

    return (
        <MarkdownErrorBoundary 
            text={text} 
            fallback={
                <div className="font-mono text-xs text-red-500 p-2 border border-red-200 rounded bg-red-50">
                    Rendering paused (syntax incomplete)...
                </div>
            }
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={mergedComponents}
            >
                {processedText}
            </ReactMarkdown>
        </MarkdownErrorBoundary>
    );
}, (prevProps, nextProps) => {
    return prevProps.text === nextProps.text && 
           prevProps.isStreaming === nextProps.isStreaming &&
           prevProps.isRunDisabled === nextProps.isRunDisabled;
});
