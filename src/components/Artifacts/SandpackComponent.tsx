/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// Define props for the component
type LiveCodesProps = {
    code: string;
    language: string;
    theme: 'dark' | 'light';
    mode?: 'inline' | 'full';
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

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Check if livecodes is available on window
        const livecodes = (window as any).livecodes;
        if (!livecodes) {
            console.error("LiveCodes script not loaded.");
            return;
        }

        const config = getLiveCodesConfig(code, language);
        
        // Initialize LiveCodes
        livecodes(containerRef.current, {
            config: {
                ...config,
                mode: 'result', // Start in result mode
            },
            params: {
                theme: theme,
                console: 'open',
                loading: 'lazy',
            }
        }).then((app: any) => {
            appRef.current = app;
        });

        // Cleanup function (if LiveCodes API supports destruction, add here)
        return () => {
            appRef.current = null;
        };
    }, [code, language, theme]);

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%', border: 'none' }} />
    );
};

// Export as default to maintain compatibility with existing lazy loads
export default LiveCodesEmbed;