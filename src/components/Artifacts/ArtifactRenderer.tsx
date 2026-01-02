/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useSyntaxTheme } from '../../hooks/useSyntaxTheme';
import type { SandpackProps } from "@codesandbox/sandpack-react";

// FIX: Added explicit SandpackProps type to React.lazy to resolve component prop type mismatch in the build environment
const Sandpack = React.lazy<React.ComponentType<SandpackProps>>(() => import("@codesandbox/sandpack-react").then(module => ({ default: module.Sandpack })));

type ArtifactRendererProps = {
    type: 'code' | 'data';
    content: string;
    language?: string;
    title?: string;
};

// Robust React detection logic
const detectIsReact = (code: string, lang: string) => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const l = normalize(lang);
    
    if (l === 'jsx' || l === 'tsx') return true;
    if (l === 'html' || l === 'css' || l === 'json' || l === 'svg' || l === 'xml') return false;
    
    const clean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // remove comments
    return (
        /import\s+React/.test(clean) || 
        /import\s+.*from\s+['"]react['"]/.test(clean) || 
        /export\s+default\s+function/.test(clean) ||
        /return\s*\(\s*<[A-Z]/.test(clean) || // JSX return pattern
        (/className=/.test(clean) && /<[a-z0-9]+/.test(clean)) // JSX attributes
    );
};

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white dark:bg-[#1e1e1e] text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <span className="text-xs font-medium animate-pulse">Initializing Preview Environment...</span>
    </div>
);

// Generates a script to intercept console logs and send them to the parent window
const generateConsoleScript = () => `
    <script>
        (function() {
            const originalConsole = window.console;
            
            function safeStringify(obj) {
                const seen = new WeakSet();
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular]';
                        }
                        seen.add(value);
                    }
                    if (typeof value === 'function') return '[Function]';
                    return value;
                }, 2);
            }

            function send(level, args) {
                try {
                    const msg = args.map(a => {
                        if (a === null) return 'null';
                        if (a === undefined) return 'undefined';
                        if (typeof a === 'object') {
                            try { return safeStringify(a); } catch(e) { return Object.prototype.toString.call(a); }
                        }
                        return String(a);
                    }).join(' ');
                    window.parent.postMessage({ type: 'ARTIFACT_LOG', level, message: msg }, '*');
                } catch(e) {
                    console.error('Error sending log to parent:', e);
                }
            }

            window.console = {
                ...originalConsole,
                log: (...args) => { originalConsole.log(...args); send('info', args); },
                info: (...args) => { originalConsole.info(...args); send('info', args); },
                warn: (...args) => { originalConsole.warn(...args); send('warn', args); },
                error: (...args) => { originalConsole.error(...args); send('error', args); },
                debug: (...args) => { originalConsole.debug(...args); send('info', args); },
            };

            window.addEventListener('error', (e) => {
                send('error', [e.message]);
            });
            window.addEventListener('unhandledrejection', (e) => {
                send('error', ['Unhandled Rejection: ' + (e.reason ? e.reason.toString() : 'Unknown')]);
            });
        })();
    </script>
`;

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ type, content, language = 'html', title }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
    const [logs, setLogs] = useState<{level: string, message: string, timestamp: number}[]>([]);
    const [showConsole, setShowConsole] = useState(false);
    const [iframeKey, setIframeKey] = useState(0); // Add key to force reload
    const syntaxStyle = useSyntaxTheme();
    
    // Theme detection
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Listen for console logs from the iframe (only for Frame mode)
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data && e.data.type === 'ARTIFACT_LOG') {
                setLogs(prev => [...prev, { level: e.data.level, message: e.data.message, timestamp: Date.now() }]);
                if (e.data.level === 'error') setShowConsole(true);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // Update iframe key when content changes significantly or tab switches back to preview
    // This ensures content refreshes correctly.
    useEffect(() => {
        if (activeTab === 'preview') {
            setIframeKey(prev => prev + 1);
        }
    }, [content.length, activeTab]);

    // Reset logs on content change
    useEffect(() => {
        setLogs([]);
    }, [content]);

    const isReact = useMemo(() => detectIsReact(content, language), [content, language]);

    const handleRefresh = useCallback(() => {
        setIframeKey(prev => prev + 1);
        setLogs([]);
    }, []);

    // Memoize options to prevent Sandpack reloading on every render
    const sandpackOptions = useMemo(() => ({
        externalResources: ["https://cdn.tailwindcss.com"],
        layout: "preview" as const,
        showCode: false, // Ensure code is hidden in preview mode
        showNavigator: false,
        showTabs: false,
        showLineNumbers: false,
        showInlineErrors: true,
        wrapContent: true,
        editorHeight: '100%',
        classes: {
            "sp-wrapper": "h-full w-full",
            "sp-layout": "h-full w-full",
            "sp-preview": "h-full w-full",
        }
    }), []);

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

        // --- Sandpack for React / ES Modules ---
        if (isReact) {
            // Ensure App.js exports default
            let finalCode = content;
            if (!content.includes('export default')) {
                // Heuristic to add export default if missing
                finalCode = content + '\n\nexport default App;'; 
            }

            return (
                <div className="h-full min-h-[400px] w-full relative">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Sandpack
                            key={iframeKey} // Force reload Sandpack on refresh
                            template="react"
                            theme={isDark ? "dark" : "light"}
                            files={{ "/App.js": finalCode }}
                            customSetup={{
                                dependencies: {
                                    "lucide-react": "latest",
                                    "recharts": "latest",
                                    "framer-motion": "latest",
                                    "clsx": "latest",
                                    "tailwind-merge": "latest"
                                }
                            }}
                            options={sandpackOptions}
                        />
                    </Suspense>
                </div>
            );
        }

        // --- Frame for HTML/JS (Standard) ---
        if (language === 'html' || language === 'svg' || language === 'javascript' || language === 'markup' || language === 'xml' || language === 'css') {
            const cleanContent = content.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
            const consoleScript = generateConsoleScript();
            const tailwindCdn = '<script src="https://cdn.tailwindcss.com"></script>';

            let initialContent = '';

            // Handle CSS
            if (language === 'css') {
                initialContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        ${consoleScript}
                        <style>
                            body { font-family: system-ui, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
                            .demo-box { padding: 2rem; border: 1px dashed #ccc; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                        </style>
                        <style>${cleanContent}</style>
                    </head>
                    <body>
                        <div class="demo-box">
                            <h1>CSS Preview</h1>
                            <p>Styles applied successfully.</p>
                            <button class="btn primary">Demo Button</button>
                        </div>
                    </body>
                    </html>
                `;
            }
            // Handle JS
            else if (['javascript', 'js'].includes(language)) {
                initialContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        ${consoleScript}
                        <style>body{font-family:sans-serif;padding:20px;}</style>
                    </head>
                    <body>
                        <div id="output"></div>
                        <script>
                            try {
                                ${cleanContent}
                            } catch(e) {
                                console.error(e);
                            }
                        </script>
                    </body>
                    </html>
                `;
            } 
            // Handle HTML
            else {
                const stylesAndScript = `${tailwindCdn}${consoleScript}`;
                if (cleanContent.includes('<head>')) {
                    initialContent = cleanContent.replace('<head>', `<head>${stylesAndScript}`);
                } else if (cleanContent.includes('<html>')) {
                     initialContent = cleanContent.replace('<html>', `<html><head>${stylesAndScript}</head>`);
                } else {
                    initialContent = `<!DOCTYPE html><html><head>${stylesAndScript}</head><body>${cleanContent}</body></html>`;
                }
            }
            
            return (
                <div className="flex flex-col h-full min-h-[400px]">
                    <div className="flex-1 relative bg-white">
                        <iframe
                            key={iframeKey}
                            srcDoc={initialContent}
                            className="absolute inset-0 w-full h-full border-none bg-white"
                            title="Artifact Preview"
                            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                        />
                    </div>
                    {/* Integrated Console Terminal */}
                    <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-gray-700 flex flex-col">
                        <div className="flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-black/20 text-xs font-mono text-gray-400 select-none">
                            <button 
                                onClick={() => setShowConsole(!showConsole)} 
                                className="flex items-center gap-2 hover:text-white transition-colors focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform ${showConsole ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                                Console {logs.length > 0 && <span className="bg-gray-600 text-white px-1 rounded-sm text-[10px]">{logs.length}</span>}
                            </button>
                            {showConsole && <button onClick={() => setLogs([])} className="hover:text-white transition-colors">Clear</button>}
                        </div>
                        {showConsole && (
                            <div className="h-40 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar">
                                {logs.length === 0 && <div className="text-gray-600 italic px-1">No output.</div>}
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2 border-b border-white/5 pb-0.5 mb-0.5 last:border-0">
                                        <span className={`flex-shrink-0 font-bold ${
                                            log.level === 'error' ? 'text-red-400' :
                                            log.level === 'warn' ? 'text-yellow-400' :
                                            'text-blue-400'
                                        }`}>
                                            {log.level === 'info' ? '›' : log.level === 'error' ? '✖' : '⚠'}
                                        </span>
                                        <span className={`break-all whitespace-pre-wrap ${log.level === 'error' ? 'text-red-300' : 'text-gray-300'}`}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        return <div className="p-4 text-slate-500">Preview not available for {language}</div>;
    };

    const highlightLang = (language === 'html' || language === 'svg' || language === 'xml') ? 'markup' : (language || 'text');

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-border-default shadow-lg bg-code-surface transition-colors duration-300">
            <div className="flex items-center justify-between px-4 py-2 bg-layer-2/50 border-b border-border-default backdrop-blur-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                    {title || (type === 'code' ? (isReact ? 'Interactive App' : 'HTML Preview') : 'Data View')}
                </span>
                <div className="flex bg-layer-3 p-0.5 rounded-lg">
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
                            language={highlightLang}
                            style={syntaxStyle}
                            customStyle={{ 
                                margin: 0, 
                                padding: '1rem', 
                                fontSize: '13px', 
                                lineHeight: '1.5',
                                background: 'transparent',
                            }}
                            codeTagProps={{
                                style: { fontFamily: "'Fira Code', monospace" }
                            }}
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