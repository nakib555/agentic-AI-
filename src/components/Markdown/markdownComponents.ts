/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { Bubble } from './Bubble';

// Helper to recursively process children for custom syntax like ==highlight==
const processChildrenForHighlights = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
        if (typeof child === 'string') {
            // Split by the highlight syntax, keeping the delimiters
            const parts = child.split(/(==.*?==)/g);
            return parts.map((part, index) => {
                if (part.startsWith('==') && part.endsWith('==')) {
                    // If it matches, render a <mark> tag
                    return React.createElement('mark', { key: index }, part.substring(2, part.length - 2));
                }
                return part; // Otherwise, return the text part
            });
        }
        // If the child is a React element, recurse on its children
        // FIX: Add generic type to `isValidElement` to inform TypeScript about the shape of props, resolving errors with accessing `child.props` and spreading it.
        if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
            return React.cloneElement(child, {
                ...child.props,
                children: processChildrenForHighlights(child.props.children)
            });
        }
        return child;
    });
};

// Custom Paragraph component that applies the highlight processing
const ParagraphWithHighlights = (props: any) => {
    return React.createElement('p', { className: "mb-4 leading-relaxed text-slate-800 dark:text-slate-300 break-words" }, processChildrenForHighlights(props.children));
};

// Custom Blockquote component that acts as a router for Callouts and Bubbles
const BlockquoteRouter = (props: any) => {
    const childrenArray = React.Children.toArray(props.children);

    // Helper to extract plain text from the direct children of a React node
    const getNodeText = (node: any): string => {
        if (!node || !node.props || !node.props.children) return '';
        let text = '';
        React.Children.forEach(node.props.children, child => {
            if (typeof child === 'string') {
                text += child;
            }
        });
        return text;
    };

    if (childrenArray.length > 0 && React.isValidElement(childrenArray[0])) {
        const firstLineText = getNodeText(childrenArray[0]).trim();
        
        // Check for Callout syntax: > [!TYPE] Title
        const calloutMatch = firstLineText.match(/^\[!(INFO|SUCCESS|WARNING|DANGER)\]\s*(.*)/i);
        if (calloutMatch) {
            const type = calloutMatch[1].toLowerCase() as any;
            const title = calloutMatch[2];
            // The content is all paragraphs after the first one (the directive)
            const content = childrenArray.slice(1);
            // FIX: Explicitly pass `children` in the props object to satisfy the `CalloutProps` type.
            return React.createElement(Callout, { type, title, children: content });
        }

        // Check for Bubble syntax: > (bubble) Text
        const bubbleMatch = firstLineText.match(/^\(bubble\)\s*(.*)/is);
        if (bubbleMatch) {
            const content = bubbleMatch[1];
            return React.createElement(Bubble, null, content);
        }
    }
    
    // If no special syntax is matched, render a standard blockquote
    return React.createElement('blockquote', { className: "custom-blockquote my-4 italic text-slate-600 dark:text-slate-400 break-words", ...props });
};


// Main component map for standard markdown rendering in the chat.
export const MarkdownComponents = {
    h1: (props: any) => React.createElement('h1', { className: "text-3xl font-bold my-6 text-slate-900 dark:text-slate-100 break-words", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-2xl font-bold my-5 text-slate-900 dark:text-slate-100 break-words", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-xl font-bold my-4 text-slate-900 dark:text-slate-100 break-words", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-lg font-bold my-3 text-slate-900 dark:text-slate-100 break-words", ...props }),
    p: ParagraphWithHighlights,
    ul: (props: any) => React.createElement('ul', { className: "list-disc list-inside mb-4 space-y-2 text-slate-800 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "list-decimal list-inside mb-4 space-y-2 text-slate-800 dark:text-slate-300", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-2 break-words", ...props }),
    blockquote: BlockquoteRouter,
    code: CodeBlock,
    pre: (props: any) => React.createElement(React.Fragment, { ...props }),
    table: (props: any) => React.createElement('div', { className: "my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700" }, React.createElement('table', { className: "w-full text-sm", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-100 dark:bg-slate-800", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "border-b border-slate-200 dark:border-slate-700 last:border-b-0", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-4 py-3 text-slate-600 dark:text-slate-300 break-words", ...props }),
    hr: (props: any) => React.createElement('hr', { className: "my-6 border-slate-200 dark:border-slate-700", ...props }),
    mark: (props: any) => React.createElement('mark', { className: "text-highlight", ...props }),
    del: (props: any) => React.createElement('del', { className: "text-slate-500 dark:text-slate-400", ...props }),
    s: (props: any) => React.createElement('s', { className: "text-slate-500 dark:text-slate-400", ...props }),
    sub: (props: any) => React.createElement('sub', { className: "align-sub text-xs mx-0.5", ...props }),
    sup: (props: any) => React.createElement('sup', { className: "align-super text-xs mx-0.5", ...props }),
};

// A more compact set of components for rendering markdown within workflow nodes.
export const WorkflowMarkdownComponents = {
    ...MarkdownComponents,
    h1: (props: any) => React.createElement('h1', { className: "text-base font-bold my-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-sm font-bold my-1.5 pb-1 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-sm font-semibold my-1 text-slate-900 dark:text-slate-100", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-xs font-semibold my-1 text-slate-800 dark:text-slate-200", ...props }),
    p: (props: any) => React.createElement('p', { className: "mb-2 leading-normal" }, processChildrenForHighlights(props.children)),
    ul: (props: any) => React.createElement('ul', { className: "list-disc list-inside mb-2 space-y-1", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "list-decimal list-inside mb-2 space-y-1", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-1", ...props }),
    blockquote: (props: any) => React.createElement('blockquote', { className: "custom-blockquote custom-blockquote-workflow my-2 italic text-slate-600 dark:text-slate-400", ...props }),
    table: (props: any) => React.createElement('div', { className: "overflow-x-auto" }, React.createElement('table', { className: "table-auto w-full my-2 border-collapse border border-slate-300 dark:border-slate-600", ...props })),
    th: (props: any) => React.createElement('th', { className: "border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-800 dark:text-slate-200", ...props }),
    td: (props: any) => React.createElement('td', { className: "border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-800 dark:text-slate-300", ...props }),
};
