
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bubble } from './Bubble';
import { StyledLink } from './StyledLink';

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

    if (childrenArray.length > 0 && React.isValidElement(childrenArray[0])) {
        const firstLineText = getNodeText(childrenArray[0]).trim();
        
        // Check for Bubble syntax: > (bubble) Text
        const bubbleMatch = firstLineText.match(/^\(bubble\)\s*(.*)/is);
        if (bubbleMatch) {
            const content = bubbleMatch[1];
            return React.createElement(Bubble, null, content);
        }
    }
    
    // If no special syntax is matched, render a standard blockquote
    return React.createElement('blockquote', { className: "custom-blockquote my-4 text-slate-700 dark:text-slate-300 break-words", ...props });
};

// Helper function to determine if a list item's children are effectively empty
// (i.e., contain only whitespace).
const isLiEmpty = (props: any): boolean => {
    const getTextContent = (children: React.ReactNode): string => {
        return React.Children.toArray(children).map(child => {
            if (typeof child === 'string') {
                return child;
            }
            if (React.isValidElement(child) && (child.props as { children?: React.ReactNode }).children) {
                return getTextContent((child.props as { children: React.ReactNode }).children);
            }
            return '';
        }).join('');
    };
    const content = getTextContent(props.children);
    return content.trim() === '';
};

// Main component map for standard markdown rendering in the chat.
export const MarkdownComponents = {
    h1: (props: any) => React.createElement('h1', { className: "text-2xl font-bold my-5 text-slate-900 dark:text-slate-100 break-words font-['Space_Grotesk']", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-xl font-bold my-4 text-slate-900 dark:text-slate-100 break-words font-['Space_Grotesk']", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-lg font-bold my-3 text-slate-900 dark:text-slate-100 break-words font-['Space_Grotesk']", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-sm font-bold my-2 text-slate-900 dark:text-slate-100 break-words font-['Space_Grotesk']", ...props }),
    p: (props: any) => React.createElement('p', { className: "text-sm mb-4 leading-relaxed text-slate-700 dark:text-slate-300 break-words", ...props }),
    // Lists: Use padding (pl-6) with list-outside to ensure markers sit in the padding area, aligned correctly.
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc list-outside pl-6 mb-4 space-y-1 text-slate-700 dark:text-slate-300 marker:text-slate-400", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal list-outside pl-6 mb-4 space-y-1 text-slate-700 dark:text-slate-300 marker:text-slate-400", ...props }),
    li: (props: any) => {
        if (isLiEmpty(props)) return null;
        return React.createElement('li', { className: "pl-1 break-words", ...props });
    },
    blockquote: BlockquoteRouter,
    a: StyledLink,
    // Responsive Table Structure
    table: (props: any) => React.createElement('div', { className: "my-4 w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 shadow-sm" }, React.createElement('table', { className: "w-full text-sm text-left border-collapse", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-50 dark:bg-white/5", ...props }),
    tbody: (props: any) => React.createElement('tbody', { className: "divide-y divide-slate-200 dark:divide-white/5", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 align-bottom", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-4 py-3 text-slate-700 dark:text-slate-300 align-top", ...props }),
    hr: (props: any) => React.createElement('hr', { className: "my-6 border-slate-200 dark:border-white/10", ...props }),
    del: (props: any) => React.createElement('del', { className: "text-slate-500 dark:text-slate-400", ...props }),
    s: (props: any) => React.createElement('s', { className: "text-slate-500 dark:text-slate-400", ...props }),
    sub: (props: any) => React.createElement('sub', { className: "align-sub text-xs mx-0.5", ...props }),
    sup: (props: any) => React.createElement('sup', { className: "align-super text-xs mx-0.5", ...props }),
};

// A more compact set of components for rendering markdown within workflow nodes.
export const WorkflowMarkdownComponents = {
    ...MarkdownComponents,
    h1: (props: any) => React.createElement('h1', { className: "text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-sm font-bold my-3 text-slate-800 dark:text-slate-100", ...props }),
    h3: (props: any) => React.createElement('h3', { className: "text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200", ...props }),
    h4: (props: any) => React.createElement('h4', { className: "text-sm font-semibold my-1 text-slate-600 dark:text-slate-300", ...props }),
    p: (props: any) => React.createElement('p', { className: "text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-2", ...props }),
    // Compact lists for workflow
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc list-outside pl-5 mb-2 space-y-1 text-slate-700 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal list-outside pl-5 mb-2 space-y-1 text-slate-700 dark:text-slate-300", ...props }),
    li: (props: any) => {
        if (isLiEmpty(props)) return null;
        return React.createElement('li', { className: "pl-1", ...props });
    },
    blockquote: (props: any) => React.createElement('blockquote', { className: "custom-blockquote custom-blockquote-workflow my-2 text-slate-700 dark:text-slate-300", ...props }),
    // Compact Table for Workflow
    table: (props: any) => React.createElement('div', { className: "my-2 w-full overflow-x-auto rounded border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20" }, React.createElement('table', { className: "w-full text-xs text-left border-collapse", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-50 dark:bg-white/5", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "border-b border-slate-100 dark:border-white/5 last:border-0", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 align-bottom", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-3 py-2 text-slate-600 dark:text-slate-300 align-top", ...props }),
};
