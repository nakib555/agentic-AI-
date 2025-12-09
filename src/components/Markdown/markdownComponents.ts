
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
    
    // If no special syntax is matched, render a standard blockquote with enhanced styling
    return React.createElement('blockquote', { className: "custom-blockquote my-6 pl-6 py-1 border-l-4 border-indigo-500/50 dark:border-indigo-400/50 bg-gray-50/50 dark:bg-white/5 rounded-r-lg text-slate-700 dark:text-white break-words", ...props });
};

type MarkdownOptions = {
    onRunCode?: (language: string, code: string) => void;
    isRunDisabled?: boolean;
};

// Factory function to create components with context (like code running handlers)
export const getMarkdownComponents = (options: MarkdownOptions = {}) => ({
    // Enhanced Typography Headers
    h1: (props: any) => React.createElement('h1', { className: "text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 mt-10 first:mt-0 font-display", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4 mt-8 font-display", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3 mt-6 font-display", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4 font-display", ...props }),
    
    // Readable Paragraphs
    p: (props: any) => React.createElement('p', { className: "text-base leading-7 text-gray-700 dark:text-white mb-5 last:mb-0", ...props }),
    
    // Styled Lists
    ul: (props: any) => React.createElement('ul', { className: "my-5 list-disc list-outside ml-5 space-y-2 text-gray-700 dark:text-white marker:text-indigo-500/70", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "my-5 list-decimal list-outside ml-5 space-y-2 text-gray-700 dark:text-white marker:text-indigo-500/70 marker:font-medium", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-1", ...props }),
    
    blockquote: BlockquoteRouter,
    a: (props: any) => React.createElement(StyledLink, props),
    
    strong: (props: any) => React.createElement('strong', { className: "font-semibold text-gray-900 dark:text-white", ...props }),
    em: (props: any) => React.createElement('em', { className: "italic text-gray-800 dark:text-white", ...props }),
    img: (props: any) => React.createElement('img', { className: "max-w-full h-auto rounded-xl my-6 border border-gray-200 dark:border-gray-800 shadow-sm", loading: "lazy", ...props }),
    mark: (props: any) => React.createElement(StyledMark, props),

    code: ({ inline, className, children, isBlock, ...props }: any) => {
        // 1. If explicit inline prop is true (legacy react-markdown), render InlineCode
        if (inline) {
             return React.createElement(InlineCode, null, children);
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
        return React.createElement(InlineCode, null, children);
    },
    
    pre: ({ children }: any) => {
        // Intercept the `code` child and inject a prop `isBlock={true}` to identify it as a block context
        // This is necessary because recent versions of react-markdown do not pass `inline` prop reliably.
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
        { className: "my-8 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-[#1e1e1e]" },
        React.createElement(
            'div',
            { className: "overflow-x-auto" },
            React.createElement('table', { className: "w-full text-left border-collapse min-w-full", ...props })
        )
    ),
    thead: (props: any) => React.createElement('thead', { className: "bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/5", ...props }),
    tbody: (props: any) => React.createElement('tbody', { className: "divide-y divide-gray-100 dark:divide-white/5 bg-transparent", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "group transition-colors duration-150 hover:bg-gray-50/50 dark:hover:bg-white/5", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white select-none", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-6 py-4 text-sm text-gray-700 dark:text-white align-top leading-relaxed", ...props }),
    
    hr: (props: any) => React.createElement('hr', { className: "my-8 border-gray-200 dark:border-white/10", ...props }),
    del: (props: any) => React.createElement('del', { className: "text-gray-400 dark:text-gray-500", ...props }),
});

// Main component map for standard markdown rendering in the chat.
export const MarkdownComponents = getMarkdownComponents();

// A more compact set of components for rendering markdown within workflow nodes.
export const WorkflowMarkdownComponents = {
    ...MarkdownComponents,
    h1: (props: any) => React.createElement('h1', { className: "text-lg font-semibold mb-2 text-slate-800 dark:text-white", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-sm font-bold my-3 text-slate-800 dark:text-white", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-sm font-semibold mb-1 text-slate-700 dark:text-white", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-sm font-semibold my-1 text-slate-600 dark:text-white", ...props }),
    p: (props: any) => React.createElement('p', { className: "text-sm leading-relaxed text-slate-700 dark:text-white mb-2", ...props }),
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc list-outside pl-5 mb-2 space-y-1 text-slate-700 dark:text-white", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal list-outside pl-5 mb-2 space-y-1 text-slate-700 dark:text-white", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-1", ...props }),
    blockquote: (props: any) => React.createElement('blockquote', { className: "custom-blockquote custom-blockquote-workflow my-2 text-slate-700 dark:text-white", ...props }),
    
    // Compact table for workflow view
    table: (props: any) => React.createElement('div', { className: "my-2 w-full overflow-x-auto rounded border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20" }, React.createElement('table', { className: "w-full text-xs text-left border-collapse", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-50 dark:bg-white/5", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "border-b border-slate-100 dark:border-white/5 last:border-0", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-3 py-2 font-semibold text-slate-700 dark:text-white align-bottom", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-3 py-2 text-slate-600 dark:text-white align-top", ...props }),
    
    code: ({ inline, className, children, isBlock, ...props }: any) => {
        if (inline) return React.createElement(InlineCode, null, children);
        const match = /language-(\w+)/.exec(className || '');
        if (isBlock || match) {
            let content = String(children ?? '').replace(/\n$/, '');
            if (Array.isArray(children)) content = children.join('');
            return React.createElement(CodeBlock, { language: match ? match[1] : 'plaintext', isStreaming: false, children: content });
        }
        return React.createElement(InlineCode, null, children);
    },
    pre: ({ children }: any) => {
        if (React.isValidElement(children)) {
             return React.createElement('div', { className: "not-prose my-2" }, 
                React.cloneElement(children as React.ReactElement<any>, { isBlock: true })
             );
        }
        return React.createElement('div', { className: "not-prose my-2" }, children);
    },
};
