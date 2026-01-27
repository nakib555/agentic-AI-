
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

// Define props for the component
type LiveCodesProps = {
    code: string;
    language: string;
    theme: 'dark' | 'light';
    mode?: 'inline' | 'full';
};

const LIVECODES_CDN = "https://cdn.jsdelivr.net/npm/livecodes@0.12.0/livecodes.js";

// Global promise to track script loading status across multiple instances
let scriptLoadingPromise: Promise<void> | null = null;

const loadLiveCodesScript = () => {
    if (scriptLoadingPromise) return scriptLoadingPromise;

    scriptLoadingPromise = new Promise((resolve, reject) => {
        if ((window as any).livecodes) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = LIVECODES_CDN;
        script.async = true;
        script.dataset.name = 'livecodes-loader';
        
        script.onload = () => {
            if ((window as any).livecodes) {
                resolve();
            } else {
                reject(new Error('LiveCodes script loaded but global object not found'));
            }
        };
        
        script.onerror = () => {
            scriptLoadingPromise = null; // Reset on failure so we can retry
            reject(new Error('Failed to load LiveCodes script from CDN'));
        };
        
        document.head.appendChild(script);
    });

    return scriptLoadingPromise;
};

// Helper to determine LiveCodes configuration based on language
const getLiveCodesConfig = (code: string, lang: string) => {
    const l = lang.toLowerCase();
    
    // Framework detection
    if (l === 'react' || l === 'jsx' || l === 'tsx') {
        return {
            template: 'react',
            script: {
                language: 'tsx',
                content: code
            }
        };
    }
    if (l === 'vue') {
        return {
            template: 'vue',
            script: {
                language: 'vue',
                content: code
            }
        };
    }
    if (l === 'svelte') {
        return {
            template: 'svelte',
            script: {
                language: 'svelte',
                content: code
            }
        };
    }
    if (l === 'python') {
        return {
            template: 'python',
            script: {
                language: 'python',
                content: code
            }
        };
    }
    if (l === 'html') {
        return {
            activeEditor: 'markup',
            markup: {
                language: 'html',
                content: code
            }
        };
    }
    if (l === 'css') {
        return {
            activeEditor: 'style',
            style: {
                language: 'css',
                content: code
            },
            markup: {
                language: 'html',
                content: '<div class="preview-container"><h3>CSS Preview</h3><p>Content styled by the CSS.</p></div>'
            }
        };
    }

    // Default to JavaScript
    return {
        activeEditor: 'script',
        script: {
            language: 'javascript',
            content: code
        }
    };
};

const LiveCodesEmbed: React.FC<LiveCodesProps> = ({ code, language, theme }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playgroundRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialization Effect: Runs only once to create the playground
    useEffect(() => {
        let isMounted = true;
        let app: any = null;

        const init = async () => {
            // Prevent double initialization
            if (playgroundRef.current) return;

            if (!containerRef.current) return;
            
            setIsLoading(true);
            setError(null);

            try {
                // Ensure script is loaded
                await loadLiveCodesScript();
                
                const livecodesGlobal = (window as any).livecodes;
                if (!livecodesGlobal) throw new Error("LiveCodes global not found");

                const createPlayground = livecodesGlobal.createPlayground;

                if (!createPlayground) {
                    throw new Error("LiveCodes initialization function not found");
                }

                if (!isMounted) return;

                // Clear container before mounting to prevent duplicates
                if (containerRef.current) {
                   containerRef.current.innerHTML = '';
                }

                // Initial Configuration
                const config = getLiveCodesConfig(code, language);
                
                // Initialize LiveCodes
                app = await createPlayground(containerRef.current, {
                    config: {
                        ...config,
                        mode: 'result', // Start in result mode
                        theme: theme,   // Initial theme
                        tools: {
                            status: 'none', // Hide status bar for cleaner look
                        }
                    },
                    params: {
                        console: 'open',
                        loading: 'lazy', // Lazy load internal assets
                        run: true,
                        embed: true,
                    }
                });
                
                if (isMounted) {
                    playgroundRef.current = app;
                    setIsLoading(false);
                } else {
                    // Component unmounted while initializing
                    await app.destroy();
                }
            } catch (err: any) {
                console.error("LiveCodes initialization failed:", err);
                if (isMounted) {
                    setError(err.message || "Failed to load preview environment.");
                    setIsLoading(false);
                }
            }
        };

        // Small delay to ensure DOM layout is stable
        const timer = setTimeout(init, 50);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (app) app.destroy();
            if (playgroundRef.current) {
                playgroundRef.current.destroy().catch(() => {});
                playgroundRef.current = null;
            }
        };
        // We purposefully omit code/theme/language from deps here to prevent re-creation.
        // Updates are handled by the second useEffect using setConfig.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // Update Effect: Runs when props change to update existing playground
    useEffect(() => {
        const update = async () => {
            if (!playgroundRef.current) return;

            try {
                const config = getLiveCodesConfig(code, language);
                
                // Use setConfig to update state without full reload
                await playgroundRef.current.setConfig({
                    ...config,
                    theme: theme,
                    mode: 'result',
                    tools: { status: 'none' }
                });
            } catch (e) {
                console.warn("Failed to update LiveCodes config", e);
            }
        };

        update();
    }, [code, language, theme]);

    if (error) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1e1e1e] text-red-500 p-4 text-center border-t border-red-200 dark:border-red-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">The external editor library failed to load. Check your internet connection.</p>
                <button 
                    onClick={() => { setError(null); setIsLoading(true); window.location.reload(); }} 
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white dark:bg-[#1e1e1e]">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-xs font-medium text-slate-500">Initializing Environment...</span>
                    <span className="text-[10px] text-slate-400 mt-1">This may take a moment</span>
                </div>
            )}
            <div ref={containerRef} style={{ height: '100%', width: '100%', border: 'none' }} />
        </div>
    );
};

export default LiveCodesEmbed;
