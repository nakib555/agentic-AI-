/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CodeBlock } from './CodeBlock';

export const MarkdownComponents = {
    h1: (props: any) => React.createElement('h1', { className: "text-3xl font-bold my-4 text-slate-900 dark:text-slate-100", ...props }),
    h2: (props: any) => React.createElement('h2', { className: "text-2xl font-bold my-3 text-slate-900 dark:text-slate-100", ...props }),
    p: (props: any) => React.createElement('p', { className: "mb-4 leading-relaxed text-slate-800 dark:text-slate-300", ...props }),
    ul: (props: any) => React.createElement('ul', { className: "list-disc list-inside mb-4 space-y-2 text-slate-800 dark:text-slate-300", ...props }),
    ol: (props: any) => React.createElement('ol', { className: "list-decimal list-inside mb-4 space-y-2 text-slate-800 dark:text-slate-300", ...props }),
    li: (props: any) => React.createElement('li', { className: "pl-2", ...props }),
    blockquote: (props: any) => React.createElement('blockquote', { className: "bg-slate-100 dark:bg-slate-800/50 border-l-4 border-purple-400 dark:border-purple-600 p-4 my-4 rounded-r-lg text-slate-700 dark:text-slate-300", ...props }),
    code: CodeBlock,
    pre: (props: any) => React.createElement(React.Fragment, null, props.children), // Render children directly to avoid double <pre> tags
    table: (props: any) => React.createElement('div', { className: "overflow-x-auto" }, React.createElement('table', { className: "table-auto w-full my-4 border-collapse border border-slate-300 dark:border-slate-600", ...props })),
    thead: (props: any) => React.createElement('thead', { className: "bg-slate-200 dark:bg-slate-700", ...props }),
    th: (props: any) => React.createElement('th', { className: "border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-800 dark:text-slate-200", ...props }),
    td: (props: any) => React.createElement('td', { className: "border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-800 dark:text-slate-300", ...props }),
    mark: (props: any) => React.createElement('mark', { style: { backgroundColor: 'var(--highlight-bg)', color: 'var(--highlight-text)' }, className: "rounded-sm px-1 py-0.5", ...props }),
    del: (props: any) => React.createElement('del', { className: "text-slate-500 dark:text-slate-400", ...props }),
    s: (props: any) => React.createElement('s', { className: "text-slate-500 dark:text-slate-400", ...props }),
    sub: (props: any) => React.createElement('sub', { className: "align-sub text-xs mx-0.5", ...props }),
    sup: (props: any) => React.createElement('sup', { className: "align-super text-xs mx-0.5", ...props }),
};