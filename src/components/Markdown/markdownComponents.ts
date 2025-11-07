/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bubble } from './Bubble';
import { StyledLink } from './StyledLink';
import { Callout, type CalloutType } from './Callout';

// Custom Blockquote component that acts as a router for Callouts and Bubbles
const BlockquoteRouter = (props: any) => {
    const { node, children, className, ...rest } = props;

    // Check if we are in a workflow context by checking for a specific class
    const isWorkflow = className?.includes('custom-blockquote-workflow');

    const firstChild = node?.children?.[0]; // This is a unist node for <p>
    if (firstChild?.tagName === 'p' && firstChild.children?.[0]?.type === 'text') {
        const firstTextNode = firstChild.children[0];
        const textValue = firstTextNode.value.trim();

        // Check for Callout syntax: > [!NOTE] Optional Title
        const calloutMatch = textValue.match(/^\[!(NOTE|TIP|INFO|WARNING|DANGER)\]\s*(.*)/i);
        if (calloutMatch) {
            const type = calloutMatch[1].toLowerCase() as CalloutType;
            const title = calloutMatch[2].trim() || undefined;
            
            // To avoid mutating the original AST, we'll work with the rendered React children.
            const childrenArray = React.Children.toArray(children);
            const firstP = childrenArray[0] as React.ReactElement;
            const firstPChildren = React.Children.toArray(firstP.props.children);

            // Find the text node that contains the callout syntax and remove it.
            if (firstPChildren.length > 0 && typeof firstPChildren[0] === 'string') {
                const newText = (firstPChildren[0] as string).trim().replace(/^\[!(NOTE|TIP|INFO|WARNING|DANGER)\]\s*(.*)\r?\n?/i, '');
                
                // If the first paragraph is now empty, exclude it.
                if(newText.trim() === '' && firstPChildren.length === 1) {
                    return React.createElement(Callout, { type, title, compact: isWorkflow }, childrenArray.slice(1));
                }
                
                // Otherwise, rebuild the first paragraph with the modified text.
                const newFirstP = React.cloneElement(firstP, firstP.props, [newText, ...firstPChildren.slice(1)]);
                return React.createElement(Callout, { type, title, compact: isWorkflow }, [newFirstP, ...childrenArray.slice(1)]);
            }
        }
        
        // Check for Bubble syntax: > (bubble) Text
        const bubbleMatch = textValue.match(/^\(bubble\)\s*(.*)/is);
        if (bubbleMatch) {
            const content = bubbleMatch[1];
            return React.createElement(Bubble, null, content);
        }
    }
    
    // If no special syntax is matched, render a standard blockquote
    return React.createElement('blockquote', { className, ...rest }, children);
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
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300", ...props }),
    li: (props: any) => {
        if (isLiEmpty(props)) return null;
        return React.createElement('li', { className: "pl-2 break-words", ...props });
    },
    blockquote: (props:any) => React.createElement(BlockquoteRouter, {...props, className: "custom-blockquote my-4 text-slate-700 dark:text-slate-300 break-words"}),
    a: StyledLink,
    table: (props: any) => React.createElement('div', { className: "my-4 overflow-x-auto" }, React.createElement('div', { className: "inline-block min-w-full" }, React.createElement('div', { className: "rounded-lg border border-slate-200 dark:border-slate-200/10" }, React.createElement('table', { className: "text-sm", ...props })))),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-100 dark:bg-black/20", ...props }),
    tr: (props: any) => React.createElement('tr', { className: "border-b border-slate-200 dark:border-slate-200/10 last:border-b-0", ...props }),
    th: (props: any) => React.createElement('th', { className: "px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200", ...props }),
    td: (props: any) => React.createElement('td', { className: "px-4 py-3 text-slate-600 dark:text-slate-300 break-words", ...props }),
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
    ul: (props: any) => React.createElement('ul', { className: "text-sm list-disc pl-5 mb-2 space-y-1.5 text-slate-700 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "text-sm list-decimal pl-5 mb-2 space-y-1.5 text-slate-700 dark:text-slate-300", ...props }),
    li: (props: any) => {
        if (isLiEmpty(props)) return null;
        return React.createElement('li', { className: "pl-1", ...props });
    },
    blockquote: (props: any) => React.createElement(BlockquoteRouter, { ...props, className: "custom-blockquote custom-blockquote-workflow my-2 text-slate-700 dark:text-slate-300" }),
    table: (props: any) => React.createElement('div', { className: "overflow-x-auto" }, React.createElement('table', { className: "table-auto w-full my-2 border-collapse border border-slate-300 dark:border-slate-600", ...props })),
    th: (props: any) => React.createElement('th', { className: "border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-700 dark:text-slate-200", ...props }),
    td: (props: any) => React.createElement('td', { className: "border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-300", ...props }),
};
