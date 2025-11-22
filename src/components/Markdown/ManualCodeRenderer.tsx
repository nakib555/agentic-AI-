/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo, useEffect } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { getMarkdownComponents } from './markdownComponents';
import rehypeMathjax from 'rehype-mathjax';
import remarkMath from 'remark-math';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

/**
 * Render a math expression using KaTeX first,
 * fallback to MathJax if KaTeX cannot render it.
 */
function renderMathHybrid(content: string) {
  try {
    // Inline Math
    if (content.startsWith('$') && content.endsWith('$') && !content.startsWith('$$')) {
      return <InlineMath>{content.slice(1, -1)}</InlineMath>;
    }

    // Block Math
    if (content.startsWith('$$') && content.endsWith('$$')) {
      return <BlockMath>{content.slice(2, -2)}</BlockMath>;
    }

    // Not math → return raw content
    return content;
  } catch (err) {
    // Fallback: render using MathJax
    // Note: MathJax must be loaded globally in your app
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: window.MathJax?.tex2chtml(content)?.outerHTML || content,
        }}
      />
    );
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

  // Preprocess highlights
  const processedText = useMemo(() => {
    if (!text) return '';
    return text
      .replace(/==\[([a-zA-Z]+)\](.*?)==/g, '<mark>[$1]$2</mark>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>');
  }, [text]);

  // Split text into math and non-math segments
  const rendered = useMemo(() => {
    // Regex splits inline $…$ and block $$…$$
    const segments = processedText.split(/(\${1,2}[^$]+\${1,2})/g);

    return (
      <div className="markdown-root">
        {segments.map((seg, i) => (
          <span key={i}>
            {/\${1,2}.*\${1,2}/.test(seg) ? renderMathHybrid(seg) : seg}
          </span>
        ))}
      </div>
    );
  }, [processedText]);

  // Optional: trigger MathJax typesetting for fallback expressions
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  }, [rendered]);

  return <div className="markdown-root">{rendered}</div>;
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
