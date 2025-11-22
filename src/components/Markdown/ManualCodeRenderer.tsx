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
  components?: Components;
  isStreaming?: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const supportedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({
  text,
  components = {},
  isStreaming = false,
  onRunCode,
  isRunDisabled
}) => {

  // Preprocess text for custom highlight syntax: ==[color]text==
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
        code({ inline, className, children }) {
          // SINGLE BACKTICK: Inline code
          if (inline) {
            return <InlineCode>{children}</InlineCode>;
          }

          // TRIPLE BACKTICK: Block code
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          // Safely join children into string
          let codeContent = '';
          if (Array.isArray(children)) {
            codeContent = children
              .map(child => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
              .join('');
          } else {
            codeContent = String(children ?? '');
          }

          // Remove trailing newline
          codeContent = codeContent.replace(/\n$/, '');

          return (
            <CodeBlock
              language={language}
              isStreaming={false} // prevent layout jumps
              onRunCode={onRunCode}
              isDisabled={isRunDisabled}
            >
              {codeContent}
            </CodeBlock>
          );
        },
        // Unwrap pre to avoid double-padding
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
