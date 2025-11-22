
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';
import { getMarkdownComponents } from './markdownComponents';

type ManualCodeRendererProps = {
  text: string;
  components: any;
  isStreaming: boolean;
  onRunCode?: (language: string, code: string) => void;
  isRunDisabled?: boolean;
};

// --- Inline Parser ---
// Handles: **bold**, *italic*, `code`, [links](url), ==highlight==, [color]highlight
const parseInline = (text: string, components: any): React.ReactNode => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Regex for all inline tokens
    // 1. Bold: **...**
    // 2. Italic: *...*
    // 3. Code: `...`
    // 4. Link: [...](...)
    // 5. Highlight: ==...==
    // 6. Color Highlight: ==[color]...==
    const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`([^`]+)`)|(\[(.*?)\]\((.*?)\))|(==\[([a-zA-Z]+)\](.*?)==)|(==(.*?)(==|$))/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        // Push preceding text
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        if (match[1]) { // Bold
            parts.push(components.strong({ key: match.index, children: parseInline(match[2], components) }));
        } else if (match[3]) { // Italic
            parts.push(components.em({ key: match.index, children: parseInline(match[4], components) }));
        } else if (match[5]) { // Inline Code
            parts.push(components.code({ key: match.index, inline: true, children: match[6] }));
        } else if (match[7]) { // Link
            parts.push(components.a({ key: match.index, href: match[9], children: match[8] }));
        } else if (match[10]) { // Colored Highlight
            const color = match[11];
            const content = match[12];
            parts.push(components.mark({ key: match.index, children: `[${color}]${content}` }));
        } else if (match[13]) { // Standard Highlight
            parts.push(components.mark({ key: match.index, children: match[14] }));
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
};

// --- Block Parser ---
const ManualCodeRendererRaw: React.FC<ManualCodeRendererProps> = ({ text, components: baseComponents, onRunCode, isRunDisabled }) => {
  
  // Merge dynamic components (for code running) with base styling components
  const components = useMemo(() => ({
      ...baseComponents,
      ...getMarkdownComponents({ onRunCode, isRunDisabled })
  }), [baseComponents, onRunCode, isRunDisabled]);

  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  
  let i = 0;
  while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code Blocks
      if (trimmed.startsWith('```')) {
          const language = trimmed.slice(3).trim();
          let codeContent = '';
          i++;
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
              codeContent += lines[i] + '\n';
              i++;
          }
          // Remove trailing newline
          if (codeContent.endsWith('\n')) codeContent = codeContent.slice(0, -1);
          
          elements.push(components.code({ 
              key: `code-${i}`, 
              className: language ? `language-${language}` : '', 
              children: codeContent, 
              inline: false 
          }));
          i++;
          continue;
      }

      // 2. Headers
      if (trimmed.startsWith('# ')) {
          elements.push(components.h1({ key: i, children: parseInline(trimmed.slice(2), components) }));
          i++; continue;
      }
      if (trimmed.startsWith('## ')) {
          elements.push(components.h2({ key: i, children: parseInline(trimmed.slice(3), components) }));
          i++; continue;
      }
      if (trimmed.startsWith('### ')) {
          elements.push(components.h3({ key: i, children: parseInline(trimmed.slice(4), components) }));
          i++; continue;
      }
      if (trimmed.startsWith('#### ')) {
          elements.push(components.h4({ key: i, children: parseInline(trimmed.slice(5), components) }));
          i++; continue;
      }

      // 3. Blockquotes
      if (trimmed.startsWith('> ')) {
          let quoteContent = trimmed.slice(2);
          // Look ahead for multi-line blockquotes
          while (i + 1 < lines.length && lines[i+1].trim().startsWith('> ')) {
              i++;
              quoteContent += '\n' + lines[i].trim().slice(2);
          }
          
          // Render blockquote content as paragraphs if it contains newlines
          const quoteChildren = quoteContent.split('\n').map((line, idx) => 
              components.p({ key: idx, children: parseInline(line, components) })
          );

          elements.push(components.blockquote({ key: i, children: quoteChildren }));
          i++; continue;
      }

      // 4. Lists (Unordered)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listItems = [];
          while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
              const content = lines[i].trim().substring(2);
              listItems.push(components.li({ key: `li-${i}`, children: parseInline(content, components) }));
              i++;
          }
          elements.push(components.ul({ key: `ul-${i}`, children: listItems }));
          continue;
      }

      // 5. Lists (Ordered)
      if (/^\d+\.\s/.test(trimmed)) {
          const listItems = [];
          while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
              const content = lines[i].trim().replace(/^\d+\.\s/, '');
              listItems.push(components.li({ key: `oli-${i}`, children: parseInline(content, components) }));
              i++;
          }
          elements.push(components.ol({ key: `ol-${i}`, children: listItems }));
          continue;
      }

      // 6. Tables (Basic Support)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Look ahead for separator row
          if (i + 1 < lines.length && lines[i+1].trim().startsWith('|') && lines[i+1].includes('---')) {
              const headerRow = trimmed.split('|').filter(c => c).map(c => c.trim());
              const rows = [];
              i += 2; // Skip header and separator
              
              while (i < lines.length && lines[i].trim().startsWith('|')) {
                  const cols = lines[i].trim().split('|').filter(c => c).map(c => c.trim());
                  rows.push(cols);
                  i++;
              }
              
              elements.push(components.table({
                  key: `table-${i}`,
                  children: [
                      components.thead({ key: 'thead', children: components.tr({ children: headerRow.map((h, idx) => components.th({ key: idx, children: parseInline(h, components) })) }) }),
                      components.tbody({ key: 'tbody', children: rows.map((r, rIdx) => components.tr({ key: rIdx, children: r.map((c, cIdx) => components.td({ key: cIdx, children: parseInline(c, components) })) })) })
                  ]
              }));
              continue;
          }
      }

      // 7. Paragraphs
      if (trimmed) {
          elements.push(components.p({ key: i, children: parseInline(line, components) }));
      } else {
          // Empty line - maybe add spacer? usually ignored in markdown unless creating new block
      }
      
      i++;
  }

  return <div className="markdown-root">{elements}</div>;
};

export const ManualCodeRenderer = memo(ManualCodeRendererRaw);
