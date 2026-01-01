
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useReducer, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Tooltip } from '../UI/Tooltip';
import { useSyntaxTheme } from '../../hooks/useSyntaxTheme';

type ArtifactSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language: string;
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
};

// --- Reducer for Complex State Management ---

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const generateConsoleScript = () => `
    <script>
        (function() {
            const originalConsole = window.console;
            function send(level, args) {
                try {
                    const msg = args.map(a => {
                        if (typeof a === 'object') {
                            try { return JSON.stringify(a, null, 2); } catch(e) { return '[Circular]'; }
                        }
                        return String(a);
                    }).join(' ');
                    window.parent.postMessage({ type: 'ARTIFACT_LOG', level, message: msg }, '*');
                } catch(e) {}
            }
            window.console = {
                ...originalConsole,
                log: (...args) => { originalConsole.log(...args); send('info', args); },
                info: (...args) => { originalConsole.info(...args); send('info', args); },
                warn: (...args) => { originalConsole.warn(...args); send('warn', args); },
                error: (...args) => { originalConsole.error(...args); send('error', args); },
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

const ArtifactSidebarRaw: React.FC<ArtifactSidebarProps> = ({ 
    isOpen, onClose, content, language, width, setWidth, isResizing, setIsResizing 
}) => {
    const { isDesktop } = useViewport();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const syntaxStyle = useSyntaxTheme();
    const dragControls = useDragControls();
    
    // UI State managed by Reducer
    const [state, dispatch] = useReducer(artifactReducer, initialState);
    
    // Local ephemeral state
    const [isCopied, setIsCopied] = useState(false);

    // Auto-switch tab based on language
    useEffect(() => {
        // Handle standard HTML, SVG, and 'markup' alias
        if (['html', 'svg', 'markup', 'xml'].includes(language)) {
            dispatch({ type: 'SET_TAB', payload: 'preview' });
        } else {
            dispatch({ type: 'SET_TAB', payload: 'code' });
        }
    }, [language]);

    // Handle content updates
    useEffect(() => {
        dispatch({ type: 'REFRESH_PREVIEW' });
        const timer = setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 600);
        return () => clearTimeout(timer);
    }, [content]); 

    // Console Log Listener
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
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

    // Memoized Preview Generation
    const previewContent = useMemo(() => {
        let cleanContent = content.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
        const consoleScript = generateConsoleScript();

        if (language === 'html' || language === 'svg' || language === 'markup' || language === 'xml') {
            if (cleanContent.includes('<head>')) {
                return cleanContent.replace('<head>', `<head>${consoleScript}`);
            }
            return `${consoleScript}${cleanContent}`;
        }
        
        if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language)) {
            // Escape closing script tags to prevent HTML parser breakage
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
                    <div id="output"></div>
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
    }, [content, language]);

    const handleTabChange = useCallback((tab: 'code' | 'preview') => {
        dispatch({ type: 'SET_TAB', payload: tab });
    }, []);

    const startResizingHandler = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            setWidth(Math.max(300, Math.min(newWidth, window.innerWidth * 0.8)));
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [setIsResizing, setWidth]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [content]);

    const handleOpenNewTab = useCallback(() => {
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(previewContent);
            win.document.close();
        }
    }, [previewContent]);

    const handleRefresh = useCallback(() => {
        dispatch({ type: 'REFRESH_PREVIEW' });
        setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 600);
    }, []);

    // Mobile Bottom Sheet Logic
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minHeight = screenHeight * 0.45; // 45vh
    const maxHeight = screenHeight * 0.95; // 95vh
    const dragRange = maxHeight - minHeight;

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!isDesktop) {
            // If dragged down past the "min height" threshold (with a small buffer)
            // or if flicked down quickly
            if (info.offset.y > dragRange + 20 || (info.velocity.y > 300 && info.offset.y > 0)) {
                onClose();
            }
        }
    };

    const isPreviewable = ['html', 'svg', 'markup', 'xml', 'javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language);
    
    // Normalize language string for display (upper case if common abbreviation)
    const displayLanguage = useMemo(() => {
        if (!language) return 'TXT';
        const raw = language.toLowerCase();
        if (['html', 'css', 'json', 'xml', 'sql', 'php', 'svg'].includes(raw)) return raw.toUpperCase();
        if (raw === 'javascript') return 'JavaScript';
        if (raw === 'typescript') return 'TypeScript';
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }, [language]);

    // Map 'html' to 'markup' for syntax highlighter if needed by the specific Prism build
    const syntaxHighlighterLanguage = useMemo(() => {
        if (language === 'html') return 'markup';
        return language;
    }, [language]);

    return (
        <motion.aside
            initial={false}
            animate={isOpen ? (isDesktop ? { width } : { y: 0 }) : (isDesktop ? { width: 0 } : { y: '100%' })}
            transition={{ type: isResizing ? 'tween' : 'spring', stiffness: 300, damping: 30 }}
            drag={!isDesktop ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: dragRange }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={onDragEnd}
            className={`
                flex-shrink-0 bg-layer-1 border-l border-border-subtle overflow-hidden flex flex-col
                ${isDesktop 
                    ? 'relative h-full z-30' 
                    : 'fixed inset-x-0 bottom-0 z-[60] border-t rounded-t-2xl shadow-2xl'
                }
            `}
            style={!isDesktop ? { height: 'auto', maxHeight: '95vh', minHeight: '45vh' } : undefined}
        >
            <div className="flex flex-col h-full overflow-hidden" style={{ width: isDesktop ? `${width}px` : '100%', height: '100%' }}>
                
                {/* Drag handle for mobile */}
                {!isDesktop && (
                    <div 
                        className="flex justify-center pt-3 pb-1 flex-shrink-0 bg-layer-1 cursor-grab active:cursor-grabbing touch-none" 
                        onPointerDown={(e) => dragControls.start(e)}
                        aria-hidden="true"
                    >
                        <div className="h-1.5 w-12 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
                    </div>
                )}

                {/* Header Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 bg-layer-1 border-b border-border-subtle flex-shrink-0">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-full">
                        <div className="flex items-center gap-2 px-2 py-1 bg-layer-2 rounded-md border border-border-default flex-shrink-0">
                            <span className="text-xs font-bold text-content-secondary uppercase tracking-wider font-mono">
                                {displayLanguage}
                            </span>
                        </div>
                        {isPreviewable && (
                            <div className="flex bg-layer-2 p-0.5 rounded-lg border border-border-default flex-shrink-0">
                                <button 
                                    onClick={() => handleTabChange('code')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                        state.activeTab === 'code' 
                                        ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                        : 'text-content-secondary hover:text-content-primary'
                                    }`}
                                >
                                    <CodeIcon />
                                    Code
                                </button>
                                <button 
                                    onClick={() => handleTabChange('preview')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                        state.activeTab === 'preview' 
                                        ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                        : 'text-content-secondary hover:text-content-primary'
                                    }`}
                                >
                                    <EyeIcon />
                                    Preview
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                        <Tooltip content="Copy Code" position="bottom" delay={500}>
                            <button 
                                onClick={handleCopy}
                                className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-layer-2 transition-colors"
                                aria-label="Copy code"
                            >
                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </Tooltip>
                        
                        <Tooltip content="Close Panel" position="bottom" delay={500}>
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-layer-2 transition-colors"
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
                <div className="flex-1 overflow-hidden relative group/content">
                    {/* CODE VIEW */}
                    <div 
                        className={`absolute inset-0 overflow-auto custom-scrollbar bg-code-surface ${state.activeTab === 'code' ? 'block' : 'hidden'}`}
                    >
                        <SyntaxHighlighter
                            language={syntaxHighlighterLanguage}
                            style={syntaxStyle}
                            customStyle={{ 
                                margin: 0, 
                                padding: '1.5rem', 
                                minHeight: '100%', 
                                fontSize: '13px', 
                                lineHeight: '1.5',
                                fontFamily: "'Fira Code', monospace",
                                background: 'transparent',
                            }}
                            showLineNumbers={true}
                            wrapLines={false} 
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', opacity: 0.3 }}
                            fallbackLanguage="text"
                        >
                            {content}
                        </SyntaxHighlighter>
                    </div>

                    {/* PREVIEW VIEW */}
                    <div 
                        className={`absolute inset-0 bg-layer-2 flex flex-col ${state.activeTab === 'preview' ? 'block' : 'hidden'}`}
                    >
                        <div className="flex items-center justify-between px-3 py-2 bg-layer-1 border-b border-border-default flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => dispatch({ type: 'TOGGLE_CONSOLE' })}
                                    className={`p-1.5 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5 ${state.showConsole ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-content-secondary hover:text-content-primary hover:bg-layer-2'}`}
                                    title="Toggle Console"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                                    Console {state.logs.length > 0 && <span className="bg-layer-2 px-1 rounded-sm text-[10px]">{state.logs.length}</span>}
                                </button>
                                <div className="w-px h-3 bg-border-strong mx-1" />
                                <Tooltip content="Reload Preview" position="bottom">
                                    <button 
                                        onClick={handleRefresh} 
                                        className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-layer-2 rounded transition-colors"
                                        aria-label="Reload Preview"
                                    >
                                        <RefreshIcon />
                                    </button>
                                </Tooltip>
                                <Tooltip content="Open in New Tab" position="bottom">
                                    <button 
                                        onClick={handleOpenNewTab}
                                        className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-layer-2 rounded transition-colors"
                                        aria-label="Open in New Tab"
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
                                    <span className="text-xs font-medium text-slate-500">Loading Preview...</span>
                                </div>
                            ) : (
                                <div className="flex-1 bg-white relative">
                                    <iframe 
                                        ref={iframeRef}
                                        key={state.iframeKey}
                                        srcDoc={previewContent}
                                        className="absolute inset-0 w-full h-full border-none bg-white"
                                        sandbox="allow-scripts allow-modals allow-forms allow-popups"
                                        title="Artifact Preview"
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
                                        className="bg-[#1e1e1e] border-t border-gray-700 flex flex-col"
                                    >
                                        <div className="flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-black/20 text-xs font-mono text-gray-400 select-none">
                                            <span>Terminal</span>
                                            <button onClick={() => dispatch({ type: 'CLEAR_LOGS' })} className="hover:text-white transition-colors">Clear</button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar">
                                            {state.logs.length === 0 && <div className="text-gray-600 italic px-1">No output.</div>}
                                            {state.logs.map((log, i) => (
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resize Handle (Desktop only) */}
            {isDesktop && (
                <div
                    className="group absolute top-0 left-0 h-full z-50 w-4 cursor-col-resize flex justify-start hover:bg-transparent pl-[1px]"
                    onMouseDown={startResizingHandler}
                >
                    <div className={`w-[2px] h-full transition-colors duration-200 ${isResizing ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-400/50'}`}></div>
                </div>
            )}
        </motion.aside>
    );
};

export const ArtifactSidebar = memo(ArtifactSidebarRaw);
