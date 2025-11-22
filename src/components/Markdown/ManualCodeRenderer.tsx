/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import rehypeRaw from 'rehype-raw';
import rehypeParse from 'rehype-parse';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import { getMarkdownComponents } from './markdownComponents';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({
  text,
  components: baseComponents,
  onRunCode,
  isRunDisabled
}) => {

  const mergedComponents = useMemo(
    () => ({
      ...baseComponents,
      ...getMarkdownComponents({ onRunCode, isRunDisabled })
    }),
    [baseComponents, onRunCode, isRunDisabled]
  );

  const processedText = useMemo(() => {
    if (!text) return '';

    return text
      .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>');
  }, [text]);

  const rendered = useMemo(() => {
    const file = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeMathjax)
      .use(rehypeReact, {
        Fragment,
        jsx,
        jsxs,
        components: mergedComponents
      } as any) // Cast to any to avoid potential strict type conflicts with rehype-react versions
      .processSync(processedText);

    return file.result;
  }, [processedText, mergedComponents]);

  return <div className="markdown-root">{rendered}</div>;
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);