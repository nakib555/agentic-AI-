
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { InlineCode } from './InlineCode';

type ManualCodeRendererProps = {
  text: string;
  components: Components;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const supportedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({ text, components, isStreaming, onRunCode, isRunDisabled }) => {
  
  // Pre-process text for custom syntax (highlights)
  // We do this globally on the text string before markdown parsing
  const processedText = useMemo(() => {
      if (!text) return '';
      return text.replace(/==(.*?)==/gs, (match, content) => {
        const colorMatch = content.match(/^\[([a-zA-Z]+)\]/);
        if (colorMatch && colorMatch[1]) {
            const colorName = colorMatch[1].toLowerCase();
            if (supportedColors.includes(colorName)) {
                const textContent = content.substring(colorMatch[0].length);
                return `<mark class="mark-highlight mark-highlight-${colorName}">${textContent}</mark>`;
            }
        }
        return `<mark class="mark-highlight mark-highlight-default">${content}</mark>`;
      });
  }, [text]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        ...components,
        // Strict condition for code rendering:
        // 1. Triple backticks (```) are rendered as 'block' code using CodeBlock.
        // 2. Single backticks (`) are rendered as 'inline' code using InlineCode (highlight style).
        code(props: any) {
          const { inline, className, children } = props;
          
          // If 'inline' is true, it comes from single backticks `code`.
          // We render this manually with a highlight block style.
          if (inline) {
             return <InlineCode>{children}</InlineCode>;
          }

          // If 'inline' is false, it comes from triple backticks ```code``` (or indented blocks).
          // We render this using the full CodeBlock component.
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          // Extract text content safely for the code block
          let codeContent = '';
          if (Array.isArray(children)) {
              codeContent = children.map(child => 
                (typeof child === 'string' || typeof child === 'number') ? String(child) : ''
              ).join('');
          } else {
              codeContent = String(children ?? '');
          }
          codeContent = codeContent.replace(/\n$/, '');

          return (
            <CodeBlock 
                language={language} 
                // We disable isStreaming for blocks inside the full renderer to prevent layout jumping
                // as react-markdown re-renders the tree.
                isStreaming={false} 
                onRunCode={onRunCode}
                isDisabled={isRunDisabled}
            >
                {codeContent}
            </CodeBlock>
          );
        },
        // Override pre to unwrap the code block (since CodeBlock provides its own container)
        // This prevents double-padding or double-borders around the CodeBlock.
        pre({ children }) {
            return <div className="not-prose my-4">{children}</div>;
        }
      }}
    >
      {processedText}
    </ReactMarkdown>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
