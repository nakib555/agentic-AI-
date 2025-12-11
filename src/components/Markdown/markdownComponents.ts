
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bubble } from './Bubble';
import { StyledLink } from './StyledLink';
import { CodeBlock } from './CodeBlock';
import { InlineCode } from './InlineCode';
import { StyledMark } from './StyledMark';

// Custom Blockquote component that acts as a router for Callouts and Bubbles
const BlockquoteRouter = (props: any) => {
    const childrenArray = React.Children.toArray(props.children);

    // Helper to recursively extract plain text content from React nodes.
    const getNodeText = (node: React.ReactNode): string => {
        if (typeof node === 'string') {
            return node;
        }
        if (Array.isArray(node)) {
            return node.map(getNodeText).join('');
        }
        if (React.isValidElement(node)) {
            const props = node.props as { children?: React.ReactNode };
            if (props.children) {
                return React.Children.toArray(props.children).map(getNodeText).join('');
            }
        }
        return '';
    };

    if (childrenArray.length > 0) {
        const firstLineText = getNodeText(childrenArray[0]).trim();
        
        // Check for Bubble syntax: > (bubble) Text
        const bubbleMatch = firstLineText.match(/^\(bubble\)\s*(.*)/is);
        if (bubbleMatch) {
            const content = bubbleMatch[1];
            return React.createElement(Bubble, null, content);
        }
    }
    
    // Standard blockquote: Softer look, like a callout or side note
    return React.createElement('blockquote', { 
        className: "custom-blockquote my-6 pl-5 py-2 border-l-4 border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/10 dark:border-indigo-400/30 rounded-r-lg text-slate-700 dark:text-slate-300 break-words", 
        ...props 
    });
};

type MarkdownOptions = {
    onRunCode?: (language: string, code: string) => void;
    isRunDisabled?: boolean;
};

// Factory function to create components with context (like code running handlers)
export const getMarkdownComponents = (options: MarkdownOptions = {}) => ({
    // Enhanced Typography Headers - Softer blacks, tighter tracking
    h1: (props: any) => React.createElement('h1', { className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6 mt-8 first:mt-0", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4 mt-8", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-lg sm:text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200 mb-3 mt-6", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-base font-semibold text-slate-800 dark:text-slate-200 mb-2 mt-4", ...props }),
    
    // Readable Paragraphs - Relaxed leading for "Smooth" reading
    p: (props: any) => React.createElement('p', { className: "text-[15px] sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 mb-5 last:mb-0", ...props }),
    
    // Styled Lists - Tighter vertical rhythm within items
    ul: (props: any) => React.createElement('ul', { className: "my-5 list-disc list-outside ml-6 space-y-1 text-[15px] sm:text-base text-slate-700 dark:text-slate-300 marker:text-slate-400", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "my-5 list-decimal list-outside ml-6 space-y-1 text-[15px] sm:text-base text-slate-700 dark:text-slate-300 marker:text-slate-400 marker:font-medium", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-1 leading-relaxed", ...props }),
    
    blockquote: BlockquoteRouter,
    a: (props: any) => React.createElement(StyledLink, props),
    
    strong: (props: any) => React.createElement('strong', { className: "font-semibold text-slate-900 dark:text-slate-100", ...props }),
    em: (props: any) => React.createElement('em', { className: "italic text-slate-800 dark:text-slate-200", ...props }),
    img: (props: any) => React.createElement('img', { className: "max-w-full h-auto rounded-xl my-6 border border-slate-200 dark:border-white/10 shadow-sm", loading: "lazy", ...props }),
    mark: (props: any) => React.createElement(StyledMark, props),

    code: ({ inline, className, children, isBlock, ...props }: any) => {
        // 1. If explicit inline prop is true (legacy react-markdown), render InlineCode
        if (inline) {
             return React.createElement(InlineCode, { className, ...props }, children);
        }

        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        
        // 2. If 'isBlock' is true (passed from our custom 'pre') OR explicitly has a language class -> CodeBlock
        if (isBlock || match) {
            let codeContent = '';
            if (Array.isArray(children)) {
                codeContent = children.map(child => 
                  (typeof child === 'string' || typeof child === 'number') ? String(child) : ''
                ).join('');
            } else {
                codeContent = String(children ?? '');
            }
            codeContent = codeContent.replace(/\n$/, '');

            return React.createElement(CodeBlock, { 
                language: language || 'plaintext', 
                isStreaming: false, 
                onRunCode: options.onRunCode,
                isDisabled: options.isRunDisabled,
                children: codeContent
            });
        }

        // 3. Fallback -> InlineCode (This covers single backticks in paragraphs)
        return React.createElement(InlineCode, { className, ...props }, children);
    },
    
    pre: ({ children }: any) => {
        // Intercept the `code` child and inject a prop `isBlock={true}`
        if (React.isValidElement(children)) {
             return React.createElement('div', { className: "not-prose my-6" }, 
                React.cloneElement(children as React.ReactElement<any>, { isBlock: true })
             );
        }
        return React.createElement('div', { className: "not-prose my-6" }, children);
    },

    // --- Enhanced Table Styling ---
    table: (props: any) => React.createElement(
        'div',
        { className: "my-8 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-[#18181b]" },
        React.createElement(
            'div',
            { className: "overflow-x-auto" },
            React.createElement('table', { className: "w-full text-left border-collapse min-w-full", ...props })
        )
    ),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10", ...props }),
    tbody: (props: any) => React.createElement('tbody', { className: "divide-y divide-slate-100 dark:divide-white/5 bg-transparent", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "group transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-white/5", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300 align-top leading-relaxed", ...props }),
    
    hr: (props: any) => React.createElement('hr', { className: "my-8 border-slate-200 dark:border-white/10", ...props }),
    del: (props: any) => React.createElement('del', { className: "text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50", ...props }),
});

// Main component map for standard markdown rendering in the chat.
export const MarkdownComponents = getMarkdownComponents();

// A more compact set of components for rendering markdown within workflow nodes.
export const WorkflowMarkdownComponents = {
    ...MarkdownComponents,
    h1: (props: any) => React.createElement('h1', { className: "text-base font-bold mb-2 text-slate-800 dark:text-slate-100", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-sm font-bold my-2 text-slate-800 dark:text-slate-100", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-xs font-semibold my-1 text-slate-600 dark:text-slate-300", ...props }),
    p: (props: any) => React.createElement('p', { className: "text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-2", ...props }),
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc list-outside pl-5 mb-2 space-y-1 text-slate-600 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal list-outside pl-5 mb-2 space-y-1 text-slate-600 dark:text-slate-300", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-1", ...props }),
    blockquote: (props: any) => React.createElement('blockquote', { className: "custom-blockquote-workflow my-2 text-slate-600 dark:text-slate-400", ...props }),
    
    // Compact table for workflow view
    table: (props: any) => React.createElement('div', { className: "my-2 w-full overflow-x-auto rounded border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20" }, React.createElement('table', { className: "w-full text-xs text-left border-collapse", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-50 dark:bg-white/5", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "border-b border-slate-100 dark:border-white/5 last:border-0", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 align-bottom", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-3 py-2 text-slate-500 dark:text-slate-400 align-top", ...props }),
    
    code: ({ inline, className, children, isBlock, ...props }: any) => {
        if (inline) return React.createElement(InlineCode, { className, ...props }, children);
        const match = /language-(\w+)/.exec(className || '');
        if (isBlock || match) {
            let content = String(children ?? '').replace(/\n$/, '');
            if (Array.isArray(children)) content = children.join('');
            // Use compact styling for workflow code blocks
            return React.createElement('div', { className: "my-2 p-3 rounded bg-slate-100 dark:bg-black/30 font-mono text-xs overflow-x-auto" }, content);
        }
        return React.createElement(InlineCode, { className, ...props }, children);
    },
    pre: ({ children }: any) => {
        if (React.isValidElement(children)) {
             return React.createElement('div', { className: "not-prose my-1" }, 
                React.cloneElement(children as React.ReactElement<any>, { isBlock: true })
             );
        }
        return React.createElement('div', { className: "not-prose my-1" }, children);
    },
};
