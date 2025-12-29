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
    // Note: the regex `\$[^$\