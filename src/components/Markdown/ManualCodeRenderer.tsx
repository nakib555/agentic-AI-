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
  // Split the text by the code block delimiter to handle streaming correctly.
  const parts = text.split('```');

  return (
    <>
      {parts.map((part, index) => {
        // Even-indexed parts (0, 2, 4...) are regular markdown text.
        if (index % 2 === 0) {
          if (part === '') return null; // Avoid rendering empty markdown sections.
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                ...components,
                // Override 'code' to handle inline code snippets within markdown sections.
                code: ({ children }) => <InlineCode children={children ?? ''} />,
              }}
            >
              {part}
            </ReactMarkdown>
          );
        }

        // Odd-indexed parts (1, 3, 5...) are code blocks.
        const firstNewlineIndex = part.indexOf('\n');
        let language = '';
        let code = '';

        // During streaming, a part with no newline might just be the language specifier.
        if (firstNewlineIndex === -1 && !part.includes(' ')) {
          language = part.trim();
          code = '';
        } else {
          // If there is a newline, the first line is potentially the language.
          const firstLine = part.substring(0, firstNewlineIndex).trim();
          // A valid language specifier is a single word with no spaces.
          if (firstNewlineIndex !== -1 && !firstLine.includes(' ')) {
            language = firstLine;
            code = part.substring(firstNewlineIndex + 1);
          } else {
            // No valid language specifier found, so the whole part is treated as code.
            language = '';
            code = part;
          }
        }
        
        return <CodeBlock key={index} language={language}>{code}</CodeBlock>;
      })}
    </>
  );
};