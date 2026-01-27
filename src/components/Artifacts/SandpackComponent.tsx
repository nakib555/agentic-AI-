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

const LIVECODES_CDN = "https://cdn.jsdelivr.net/npm/livecodes@0.12.0/livecodes.umd.js";

// Helper to load script safely
const loadLiveCodesScript = () => {
    return new Promise<void>((resolve, reject) => {
        if ((window as any).livecodes) {
            resolve();
            return;
        }

        // Check if already present in DOM but not yet loaded
        const existingScript = document.querySelector(`script[src="${LIVECODES_CDN}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('LiveCodes script failed to load')));
            return;
        }

        const script = document.createElement('script');
        script.src = LIVECODES_CDN;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load LiveCodes script'));
        document.head.appendChild(script);
    });
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
    const appRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const init = async () => {
            if (!containerRef.current) return;
            
            setIsLoading(true);
            setError(null);

            try {
                // Ensure script is loaded
                await loadLiveCodesScript();
                
                const livecodes = (window as any).livecodes;
                if (!livecodes) throw new Error("LiveCodes global not found");

                const config = getLiveCodesConfig(code, language);
                
                // Clear container before mounting to prevent duplicates
                if (containerRef.current) {
                   containerRef.current.innerHTML = '';
                }
                
                // Initialize LiveCodes
                const app = await livecodes(containerRef.current, {
                    config: {
                        ...config,
                        mode: 'result', // Start in result mode
                    },
                    params: {
                        theme: theme,
                        console: 'open',
                        loading: 'lazy',
                        run: true,
                    }
                });
                
                if (isMounted) {
                    appRef.current = app;
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("LiveCodes initialization failed:", err);
                if (isMounted) {
                    setError("Failed to load preview environment.");
                    setIsLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [code, language, theme]);

    if (error) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1e1e1e] text-red-500 p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-xs text-indigo-500 hover:underline">Reload Page</button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white dark:bg-[#1e1e1e]">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-medium text-slate-500">Initializing Environment...</span>
                </div>
            )}
            <div ref={containerRef} style={{ height: '100%', width: '100%', border: 'none' }} />
        </div>
    );
};

// Export as default to maintain compatibility with existing lazy loads
export default LiveCodesEmbed;