
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabButton } from '../UI/TabButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../hooks/useTheme';

type ArtifactRendererProps = {
    type: 'code' | 'data';
    content: string;
    language?: string;
    title?: string;
};

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ type, content, language = 'html', title }) => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
    const [iframeKey, setIframeKey] = useState(0);

    // Refresh iframe when content changes
    useEffect(() => {
        setIframeKey(prev => prev + 1);
    }, [content]);

    const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
        : theme;

    const renderPreview = () => {
        if (type === 'data') {
            try {
                // Basic CSV/JSON table renderer
                const isJson = content.trim().startsWith('{') || content.trim().startsWith('[');
                let data = isJson ? JSON.parse(content) : null;
                
                // If simple array of objects, render table
                if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                    const headers = Object.keys(data[0]);
                    return (
                        <div className="overflow-auto max-h-[400px]">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-white/5 sticky top-0">
                                    <tr>
                                        {headers.map(h => (
                                            <th key={h} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, i) => (
                                        <tr key={i} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                            {headers.map(h => (
                                                <td key={h} className="px-4 py-2 text-slate-600 dark:text-slate-400">{String(row[h])}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return <pre className="p-4 text-xs font-mono">{JSON.stringify(data, null, 2)}</pre>;
            } catch (e) {
                return <div className="p-4 text-red-500">Failed to parse data artifact.</div>;
            }
        }

        // Code Preview (HTML/SVG/JS)
        if (language === 'html' || language === 'svg' || language === 'javascript') {
            const srcDoc = language === 'javascript' 
                ? `<html><body><script>${content}</script></body></html>`
                : content;
            
            return (
                <iframe 
                    key={iframeKey}
                    srcDoc={srcDoc}
                    className="w-full h-full min-h-[400px] border-none bg-white"
                    sandbox="allow-scripts"
                    title="Artifact"
                />
            );
        }
        
        return <div className="p-4 text-slate-500">Preview not available for {language}</div>;
    };

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d0d] shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title || (type === 'code' ? 'Interactive App' : 'Data View')}
                </span>
                <div className="flex bg-gray-200 dark:bg-black/30 p-0.5 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Preview
                    </button>
                    <button 
                        onClick={() => setActiveTab('source')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'source' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Source
                    </button>
                </div>
            </div>

            <div className="relative">
                {activeTab === 'preview' ? (
                    renderPreview()
                ) : (
                    <div className="max-h-[400px] overflow-auto custom-scrollbar">
                        <SyntaxHighlighter
                            language={language || 'text'}
                            style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
                            customStyle={{ margin: 0, padding: '1rem', fontSize: '13px' }}
                            showLineNumbers
                        >
                            {content}
                        </SyntaxHighlighter>
                    </div>
                )}
            </div>
        </div>
    );
};
