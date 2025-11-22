
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
import { getMarkdownComponents } from './markdownComponents';

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

  // Create a custom components map that includes the run code handlers
  const customComponents = useMemo(() => {
      // We merge the passed components (which might be base MarkdownComponents) 
      // with our dynamic ones that need the run callbacks.
      // getMarkdownComponents handles the creation of the robust 'code' and 'pre' blocks.
      const dynamicComponents = getMarkdownComponents({ onRunCode, isRunDisabled });
      
      return {
          ...components,
          ...dynamicComponents
      };
  }, [components, onRunCode, isRunDisabled]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={customComponents}
    >
      {processedText}
    </ReactMarkdown>
  );
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);