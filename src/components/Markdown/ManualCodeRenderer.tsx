/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
};

export const ManualCodeRenderer: React.FC<ManualCodeRendererProps> = ({ text, components }) => {
  // Regex to split the text by code blocks, keeping the delimiters (the code blocks themselves).
  const blockRegex = /(```(?:[a-zA-Z0-9\-_]+)?\n[\s\S]*?\n```)/g;
  const parts = text.split(blockRegex).filter(part => part);

  return (
    <>
      {parts.map((part, index) => {
        // Check if the current part is a code block.
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```([a-zA-Z0-9\-_]+)?\n([\s\S]*?)\n```$/);
          if (match) {
            const language = match[1];
            // Trim the final newline from the code block content.
            // FIX: Add a fallback for match[2] to prevent runtime errors if it's undefined
            // and to satisfy the type-checker that `children` is always provided to `CodeBlock`.
            const code = (match[2] || '').trimEnd();
            // FIX: Pass `code` as a JSX child to resolve a TypeScript type error where passing `children`
            // as a prop conflicts with the special `key` prop.
            return <CodeBlock key={index} language={language}>{code}</CodeBlock>;
          }
        }
        
        // If it's not a code block, it's regular markdown text that may contain inline code.
        // We render this part with ReactMarkdown, but provide a custom renderer for `code`
        // that specifically handles the inline case. This preserves paragraph flow.
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              ...components,
              // This custom code renderer is scoped to text that is NOT a full code block.
              // It will only be triggered for inline code snippets.
              // FIX: Provide a fallback for children to prevent passing undefined, which violates InlineCode's required prop type.
              // Also, pass `children` as an explicit prop to fix the type error.
              code: ({ children }) => {
                return <InlineCode children={children ?? ''} />;
              },
            }}
          >
            {part}
          </ReactMarkdown>
        );
      })}
    </>
  );
};