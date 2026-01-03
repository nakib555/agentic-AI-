
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - livecodes is loaded via importmap
import { createPlayground } from 'livecodes';

type LiveCodesEmbedProps = {
    code: string;
    language: string;
    theme: 'dark' | 'light';
    mode?: 'inline' | 'full';
};

const LiveCodesEmbed: React.FC<LiveCodesEmbedProps> = ({ code, language, theme, mode = 'inline' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playgroundRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    // Helper for base CSS to match theme
    const getBaseStyles = (currentTheme: 'dark' | 'light') => `
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            padding: 1rem; 
            margin: 0;
            background-color: ${currentTheme === 'dark' ? '#1e1e1e' : '#ffffff'};
            color: ${currentTheme === 'dark' ? '#fff' : '#1e293b'};
        }
        #app {
            height: 100%;
            width: 100%;
        }
    `;

    // React-specific helper to ensure export default
    const prepareReactCode = (source: string) => {
        if (source.includes('export default')) return source;
        return `${source}\n\n// Explicit export added by system\nexport default App;`;
    };

    // Determine configuration based on language
    const getConfig = (currentCode: string, currentLang: string, currentTheme: 'dark' | 'light') => {
        const lang = currentLang.toLowerCase();
        
        const config: any = {
            title: "Code Playground",
            mode: "result",
            theme: currentTheme,
            style: {
                language: "css",
                content: getBaseStyles(currentTheme)
            },
        };

        // --- React / JSX / TSX ---
        // Heuristic: If lang is explicitly React-like OR (JS/TS and contains React imports/exports)
        const isReact = ['react', 'jsx', 'tsx'].includes(lang) || 
                       (['javascript', 'js', 'typescript', 'ts'].includes(lang) && 
                        (currentCode.includes('react') || currentCode.includes('export default')));

        if (isReact) {
             config.script = {
                 // Map to jsx/tsx for LiveCodes to pick up React transform
                 language: (lang === 'ts' || lang === 'typescript' || lang === 'tsx') ? 'tsx' : 'jsx',
                 content: prepareReactCode(currentCode)
             };
             config.customSettings = { template: "react" };
             config.processors = ["tailwindcss"];
             // Pre-load common React ecosystem libs
             config.imports = {
                 "react": "https://esm.sh/react@18.2.0",
                 "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
                 "lucide-react": "https://esm.sh/lucide-react@0.263.1",
                 "recharts": "https://esm.sh/recharts@2.7.2",
                 "framer-motion": "https://esm.sh/framer-motion@10.12.16",
                 "clsx": "https://esm.sh/clsx",
                 "tailwind-merge": "https://esm.sh/tailwind-merge",
                 "date-fns": "https://esm.sh/date-fns",
                 "react-markdown": "https://esm.sh/react-markdown",
                 "lodash": "https://esm.sh/lodash@4.17.21"
             };
             config.markup = { language: "html", content: '<div id="app"></div>' };
             return config;
        }

        // --- Vue ---
        if (lang === 'vue') {
            config.script = { language: "vue", content: currentCode };
            config.customSettings = { template: "vue" };
            return config;
        }
        
        // --- Svelte ---
        if (lang === 'svelte') {
            config.script = { language: "svelte", content: currentCode };
            config.customSettings = { template: "svelte" };
            return config;
        }

        // --- Python ---
        if (lang === 'python' || lang === 'py') {
             config.script = { language: "python", content: currentCode };
             // No template needed, LiveCodes uses Pyodide automatically
             config.markup = { language: "html", content: '<h3>Python Output:</h3>' };
             return config;
        }

        // --- Go ---
        if (lang === 'go') {
            config.script = { language: "go", content: currentCode };
            return config;
        }

        // --- Fallback / Generic ---
        config.script = {
            language: lang,
            content: currentCode
        };
        
        return config;
    };

    // Initialize Playground
    useEffect(() => {
        if (!containerRef.current) return;

        if (playgroundRef.current) {
            try { playgroundRef.current.destroy(); } catch (e) {}
            playgroundRef.current = null;
        }

        let isMounted = true;

        const initPlayground = async () => {
            const config = getConfig(code, language, theme);
            
            const options = {
                appUrl: 'https://v29.livecodes.io/',
                params: {
                    console: 'open',
                    mode: 'result',
                    loading: 'eager',
                    embed: true,
                },
                config: config
            };

            try {
                // @ts-ignore
                const playground = await createPlayground(containerRef.current!, options);
                if (isMounted) {
                    playgroundRef.current = playground;
                    setIsReady(true);
                } else {
                    playground.destroy();
                }
            } catch (err) {
                console.error("Failed to initialize LiveCodes playground:", err);
            }
        };

        initPlayground();

        return () => {
            isMounted = false;
            if (playgroundRef.current) {
                try { playgroundRef.current.destroy(); } catch (e) { }
                playgroundRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Dynamic Updates
    useEffect(() => {
        if (!isReady || !playgroundRef.current) return;
        
        // Re-calculate config when props change
        const newConfig = getConfig(code, language, theme);
        
        playgroundRef.current.setConfig({
            ...playgroundRef.current.getConfig(),
            ...newConfig
        });
    }, [code, language, theme, isReady]);

    return (
        <div 
            className="w-full h-full relative"
            style={{
                borderRadius: mode === 'inline' ? '0' : '0',
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div ref={containerRef} className="w-full flex-1 min-h-0 absolute inset-0" />
        </div>
    );
};

export default LiveCodesEmbed;
