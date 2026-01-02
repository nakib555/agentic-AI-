
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useReducer, useEffect, useMemo, useCallback, useState, Suspense } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Tooltip } from '../UI/Tooltip';
import { useSyntaxTheme } from '../../hooks/useSyntaxTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { VirtualizedCodeViewer } from './VirtualizedCodeViewer';
import type { SandpackProps } from "@codesandbox/sandpack-react";

// FIX: Added explicit SandpackProps type to React.lazy
const Sandpack = React.lazy<React.ComponentType<SandpackProps>>(() => import("@codesandbox/sandpack-react").then(module => ({ default: module.Sandpack })));

// --- Icons ---
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-500">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

// --- Reducer ---
type LogEntry = { level: string, message: string, timestamp: number };

type State = {
    activeTab: 'code' | 'preview';
    iframeKey: number;
    logs: LogEntry[];
    showConsole: boolean;
    isLoading: boolean;
};

type Action = 
    | { type: 'SET_TAB', payload: 'code' | 'preview' }
    | { type: 'REFRESH_PREVIEW' }
    | { type: 'SET_LOADING', payload: boolean }
    | { type: 'ADD_LOG', payload: LogEntry }
    | { type: 'TOGGLE_CONSOLE' }
    | { type: 'SHOW_CONSOLE_ON_ERROR' }
    | { type: 'CLEAR_LOGS' };

const initialState: State = {
    activeTab: 'code',
    iframeKey: 0,
    logs: [],
    showConsole: false,
    isLoading: true,
};

const artifactReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_TAB': 
            return { ...state, activeTab: action.payload };
        case 'REFRESH_PREVIEW':
            return { ...state, iframeKey: state.iframeKey + 1, logs: [], isLoading: true };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'ADD_LOG':
            return { ...state, logs: [...state.logs, action.payload] };
        case 'TOGGLE_CONSOLE':
            return { ...state, showConsole: !state.showConsole };
        case 'SHOW_CONSOLE_ON_ERROR':
            return { ...state, showConsole: true };
        case 'CLEAR_LOGS':
            return { ...state, logs: [] };
        default: 
            return state;
    }
};

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

const detectIsReact = (code: string, lang: string) => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const l = normalize(lang);
    
    // Explicit React languages
    if (l === 'jsx' || l === 'tsx') return true;
    
    // Explicit non-React web languages
    if (l === 'html' || l === 'css' || l === 'json' || l === 'svg' || l === 'xml') return false;
    
    // Heuristics for JS/TS
    const clean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // remove comments
    return (
        /import\s+React/.test(clean) || 
        /import\s+.*from\s+['"]react['"]/.test(clean) || 
        // Fallback: If it exports default function and looks like a component, treat as React for Sandpack
        (/export\s+default\s+function/.test(clean) && /return\s*\(\s*<[A-Z]/.test(clean)) ||
        // Fallback: JSX attributes with tags
        (/className=/.test(clean) && /<[a-z0-9]+/.test(clean))
    );
};

const VIRTUALIZATION_THRESHOLD_SIZE = 20 * 1024; 

type ArtifactContentProps = {
    content: string;
    language: string;
    onClose: () => void;
};

// Segmented Toggle Component
const SegmentedToggle = ({ 
    options, 
    active, 
    onChange 
}: { 
    options: { id: string, label: string, icon: React.ReactNode }[], 
    active: string, 
    onChange: (id: any) => void 
}) => {
    return (
        <div className="flex p-1 bg-gray-100 dark:bg-black/40 rounded-lg border border-gray-200/50 dark:border-white/5 relative">
            {options.map((opt) => {
                const isActive = active === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`
                            relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors z-10
                            ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="segment-bg"
                                className="absolute inset-0 bg-white dark:bg-white/10 rounded-md shadow-sm border border-black/5 dark:border-white/5"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            {opt.icon}
                            {opt.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export const ArtifactContent: React.FC<ArtifactContentProps> = React.memo(({ content, language, onClose }) => {
    const syntaxStyle = useSyntaxTheme();
    const [state, dispatch] = useReducer(artifactReducer, initialState);
    const [isCopied, setIsCopied] = React.useState(false);
    
    // Live content debounced for Code View (Highlighter)
    const [debouncedContent, setDebouncedContent] = useState(content);
    
    // Frozen content for Preview View (Iframe/Sandpack)
    // We do NOT update this automatically on content change to prevent refresh loops/flicker
    const [previewCode, setPreviewCode] = useState(content);

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // 1. Initialize Preview State
    // Reset preview code if language changes (implies completely new file)
    useEffect(() => {
        setPreviewCode(content);
    }, [language]);

    // Ensure preview has content if it started empty (initial stream packet)
    useEffect(() => {
        if (!previewCode && content) {
            setPreviewCode(content);
        }
    }, [content, previewCode]);

    // 2. Tab Selection Logic
    useEffect(() => {
        const isRenderable = ['html', 'svg', 'markup', 'xml', 'css', 'javascript', 'js', 'ts', 'jsx', 'tsx'].includes(language) || detectIsReact(content, language);
        // Auto-switch to preview if content is manageable size and renderable type
        if (content.length < 50000 && isRenderable) {
            dispatch({ type: 'SET_TAB', payload: 'preview' });
        } else {
            dispatch({ type: 'SET_TAB', payload: 'code' });
        }
    }, [language]); // Only run when language/file changes, not on every content keystroke

    // 3. Debounce Live Content for Code View
    useEffect(() => {
        const length = content.length;
        let delay = 100;
        if (length > 1000000) delay = 1500;
        else if (length > 100000) delay = 800;
        else if (length > 20000) delay = 300;

        const handler = setTimeout(() => {
            setDebouncedContent(content);
        }, delay);
        return () => clearTimeout(handler);
    }, [content]);

    // 4. Loading State Management
    useEffect(() => {
        if (state.activeTab === 'preview') {
            const timer = setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 200);
            return () => clearTimeout(timer);
        }
    }, [previewCode, state.activeTab]); 

    useEffect(() => {
        if (state.activeTab === 'code') {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [debouncedContent, state.activeTab]);

    // 5. Console Logs
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data && e.data.type === 'ARTIFACT_LOG') {
                dispatch({ 
                    type: 'ADD_LOG', 
                    payload: { level: e.data.level, message: e.data.message, timestamp: Date.now() } 
                });
                if (e.data.level === 'error') {
                    dispatch({ type: 'SHOW_CONSOLE_ON_ERROR' });
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // 6. React Detection based on Frozen Preview Code
    const isReact = useMemo(() => {
        if (previewCode.length > 50000) return false;
        return detectIsReact(previewCode, language);
    }, [previewCode, language]);

    // 7. Preview Content Generation (Iframe)
    const iframeContent = useMemo(() => {
        if (!previewCode) return '';
        
        let cleanContent = previewCode.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
        const consoleScript = generateConsoleScript();
        const tailwindCdn = '<script src="https://cdn.tailwindcss.com"></script>';

        if (['html', 'svg', 'markup', 'xml'].includes(language)) {
            const stylesAndScript = `${tailwindCdn}${consoleScript}`;
            if (cleanContent.includes('<head>')) {
                return cleanContent.replace('<head>', `<head>${stylesAndScript}`);
            } else if (cleanContent.includes('<html>')) {
                return cleanContent.replace('<html>', `<html><head>${stylesAndScript}</head>`);
            }
            return `<!DOCTYPE html><html><head>${stylesAndScript}</head><body>${cleanContent}</body></html>`;
        }
        
        if (['css', 'scss', 'less'].includes(language)) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    ${consoleScript}
                    <style>
                        body { font-family: system-ui, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
                        h1 { color: #333; margin-bottom: 1rem; }
                        .demo-container { padding: 2rem; border: 1px dashed #ccc; border-radius: 8px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    </style>
                    <style>${cleanContent}</style>
                </head>
                <body>
                    <div class="demo-container">
                        <h1>CSS Preview</h1>
                        <p>The styles above are applied to this document.</p>
                        <button class="btn primary">Demo Button</button>
                    </div>
                </body>
                </html>
            `;
        }

        if (['javascript', 'typescript', 'js', 'ts'].includes(language)) {
            const safeContent = cleanContent.replace(/<\/script>/g, '<\\/script>');
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>body { font-family: system-ui, sans-serif; padding: 20px; color: #333; } @media (prefers-color-scheme: dark) { body { color: #eee; } }</style>
                    ${consoleScript}
                </head>
                <body>
                    <div id="root"></div>
                    <script type="module">
                        try {
                            ${safeContent}
                        } catch (e) {
                            console.error(e);
                        }
                    </script>
                </body>
                </html>
            `;
        }
        return '';
    }, [previewCode, language]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [content]);

    const handleOpenNewTab = useCallback(() => {
        if (!isReact) {
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(iframeContent);
                win.document.close();
            }
        } else {
            alert("Interactive previews are embedded and cannot be opened in a new tab yet.");
        }
    }, [iframeContent, isReact]);

    const handleRefresh = useCallback(() => {
        setPreviewCode(content); // Explicitly update preview with latest live content
        dispatch({ type: 'REFRESH_PREVIEW' });
        // Allow time for Sandpack/Iframe to unmount/remount
        setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 300);
    }, [content]);

    const isPreviewable = ['html', 'svg', 'markup', 'xml', 'javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx', 'css'].includes(language) || isReact;
    
    const displayLanguage = useMemo(() => {
        if (!language) return 'TXT';
        const raw = language.toLowerCase();
        if (isReact) return 'REACT';
        if (['html', 'css', 'json', 'xml', 'sql', 'php', 'svg'].includes(raw)) return raw.toUpperCase();
        if (raw === 'javascript') return 'JavaScript';
        if (raw === 'typescript') return 'TypeScript';
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }, [language, isReact]);

    const syntaxHighlighterLanguage = useMemo(() => {
        if (language === 'html') return 'markup';
        return language;
    }, [language]);

    const useVirtualization = useMemo(() => {
        return content.length > VIRTUALIZATION_THRESHOLD_SIZE;
    }, [content.length]);

    return (
        <div className="flex flex-col h-full overflow-hidden w-full bg-white dark:bg-[#09090b]">
            {/* Elegant Header */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-3 bg-white/80 dark:bg-[#09090b]/80 border-b border-gray-200 dark:border-white/5 backdrop-blur-md sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-4 overflow-hidden max-w-full">
                    <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 shrink-0">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest font-mono">
                            {displayLanguage}
                        </span>
                        {useVirtualization && state.activeTab === 'code' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold uppercase tracking-wide">
                                LARGE FILE
                            </span>
                        )}
                    </div>
                    
                    {isPreviewable && (
                        <SegmentedToggle 
                            options={[
                                { id: 'code', label: 'Code', icon: <CodeIcon /> },
                                { id: 'preview', label: 'Preview', icon: <EyeIcon /> }
                            ]}
                            active={state.activeTab}
                            onChange={(id) => dispatch({ type: 'SET_TAB', payload: id })}
                        />
                    )}
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                    <Tooltip content="Copy Code" position="bottom" delay={500}>
                        <button 
                            onClick={handleCopy}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            aria-label="Copy code"
                        >
                            {isCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </Tooltip>
                    
                    <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

                    <Tooltip content="Close Panel" position="bottom" delay={500}>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            aria-label="Close artifact"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col w-full">
                {/* CODE VIEW */}
                <div 
                    className={`flex-1 relative overflow-auto custom-scrollbar bg-code-surface ${state.activeTab === 'code' ? 'block' : 'hidden'}`}
                >
                    {useVirtualization ? (
                        <VirtualizedCodeViewer 
                            content={debouncedContent} 
                            language={language}
                            theme={syntaxStyle}
                        />
                    ) : (
                        <SyntaxHighlighter
                            language={syntaxHighlighterLanguage || 'text'}
                            style={syntaxStyle}
                            customStyle={{ 
                                margin: 0, 
                                padding: '1.5rem', 
                                minHeight: '100%', 
                                fontSize: '13px', 
                                lineHeight: '1.6',
                                fontFamily: "'Fira Code', monospace",
                                background: 'transparent',
                            }}
                            showLineNumbers={true}
                            wrapLines={false} 
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', opacity: 0.3 }}
                            fallbackLanguage="text"
                        >
                            {debouncedContent || ''}
                        </SyntaxHighlighter>
                    )}
                </div>

                {/* PREVIEW VIEW */}
                <div 
                    className={`flex-1 relative flex flex-col bg-gray-50 dark:bg-black/20 ${state.activeTab === 'preview' ? 'block' : 'hidden'}`}
                >
                    {isReact ? (
                        <div className="flex-1 w-full h-full relative bg-white">
                             <Suspense fallback={
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Loading Sandbox...</span>
                                </div>
                             }>
                                 {/* Key forces remount on refresh */}
                                 <Sandpack
                                    key={state.iframeKey} 
                                    template="react"
                                    theme={isDark ? "dark" : "light"}
                                    files={{ 
                                        "/App.js": previewCode,
                                        "/styles.css": `@import "tailwindcss/base"; @import "tailwindcss/components"; @import "tailwindcss/utilities";`
                                    }}
                                    options={{
                                        externalResources: ["https://cdn.tailwindcss.com"],
                                        layout: 'preview',
                                        // We handle custom refresh, disable auto reload loop if possible by controlling content updates
                                        showRefreshButton: false 
                                    }}
                                 />
                            </Suspense>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-white/5 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                                </div>
                                
                                <div className="flex-1 mx-4 text-center">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-white/5">
                                        Browser Preview
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => dispatch({ type: 'TOGGLE_CONSOLE' })}
                                        className={`p-1.5 text-[10px] font-mono font-medium rounded transition-colors flex items-center gap-1.5 ${state.showConsole ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                        title="Toggle Console"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                                        TERM {state.logs.length > 0 && <span className="bg-black/10 dark:bg-white/10 px-1 rounded-[2px]">{state.logs.length}</span>}
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 dark:bg-white/10 mx-1" />
                                    <Tooltip content="Refresh Preview" position="bottom">
                                        <button 
                                            onClick={handleRefresh} 
                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors"
                                        >
                                            <RefreshIcon />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Open in New Tab" position="bottom">
                                        <button 
                                            onClick={handleOpenNewTab}
                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors"
                                        >
                                            <ExternalLinkIcon />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="flex-1 relative flex flex-col overflow-hidden">
                                {state.isLoading ? (
                                    <div className="absolute inset-0 bg-white dark:bg-[#121212] z-10 flex flex-col items-center justify-center space-y-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Rendering...</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-white relative w-full h-full">
                                        <iframe
                                            key={state.iframeKey}
                                            srcDoc={iframeContent}
                                            className="absolute inset-0 w-full h-full border-none bg-white"
                                            title="Artifact Preview"
                                            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                                        />
                                    </div>
                                )}
                                
                                {/* Console Terminal Panel */}
                                <AnimatePresence>
                                    {state.showConsole && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: '35%' }}
                                            exit={{ height: 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            className="bg-[#1e1e1e] border-t border-gray-700 flex flex-col w-full z-20"
                                        >
                                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-black/20 text-[10px] font-mono text-gray-400 select-none uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
                                                    Output Log
                                                </div>
                                                <button onClick={() => dispatch({ type: 'CLEAR_LOGS' })} className="hover:text-white transition-colors">Clear</button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar">
                                                {state.logs.length === 0 && <div className="text-gray-600 italic px-1 pt-1">Console empty.</div>}
                                                {state.logs.map((log, i) => (
                                                    <div key={i} className="flex gap-2 border-b border-white/5 pb-1 mb-1 last:border-0 items-start">
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
                                                        <span className="ml-auto text-[9px] text-gray-600 tabular-nums">
                                                            {new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
