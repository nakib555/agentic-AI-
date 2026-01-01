
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

type VirtualizedCodeViewerProps = {
    content: string;
    language: string;
    theme: any; // Syntax theme object
};

export const VirtualizedCodeViewer: React.FC<VirtualizedCodeViewerProps> = ({ content, language }) => {
    // Split content into lines for virtualization
    // This is fast even for 1M lines (e.g. ~100ms for 10MB text)
    const lines = useMemo(() => content.split('\n'), [content]);

    return (
        <div className="h-full w-full bg-code-surface text-code-text font-mono text-[13px]">
            <Virtuoso
                style={{ height: '100%', width: '100%' }}
                totalCount={lines.length}
                overscan={200} // Pre-render a bit more for smoother scrolling
                itemContent={(index) => {
                    const line = lines[index];
                    return (
                        <div className="flex leading-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            {/* Line Number */}
                            <span 
                                className="w-12 flex-shrink-0 text-right pr-4 text-slate-400 dark:text-slate-600 select-none border-r border-slate-200 dark:border-white/5 mr-4 bg-slate-50/50 dark:bg-white/[0.02]"
                                style={{ fontFamily: 'inherit' }}
                            >
                                {index + 1}
                            </span>
                            
                            {/* Line Content - Plain text for max performance on massive files */}
                            {/* 
                                Note: For 1M lines, full syntax highlighting per-line is prohibitively expensive 
                                without a web-worker based tokenizer (like Monaco). 
                                We prioritize scrolling smoothness and stability here.
                            */}
                            <span className="whitespace-pre break-all pr-4" style={{ fontFamily: "'Fira Code', monospace" }}>
                                {line || ' '} 
                            </span>
                        </div>
                    );
                }}
            />
        </div>
    );
};
