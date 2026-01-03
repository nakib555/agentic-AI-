/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - livecodes is loaded via importmap
import { createPlayground } from 'livecodes';

type SandpackComponentProps = {
    code: string;
    theme: 'dark' | 'light';
    mode?: 'inline' | 'full';
};

const SandpackComponent: React.FC<SandpackComponentProps> = ({ code, theme, mode = 'inline' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playgroundRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    // Helper to ensure code has an export default
    const prepareCode = (source: string) => {
        if (source.includes('export default')) return source;
        return `${source}\n\n// Explicit export added by system\nexport default App;`;
    };

    // Helper for base CSS to match theme
    const getBaseStyles = (currentTheme: 'dark' | 'light') => `
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            padding: 1rem; 
            margin: 0;
            background-color: ${currentTheme === 'dark' ? '#1e1e1e' : '#ffffff'};
            color: ${currentTheme === 'dark' ? '#fff' : '#1e293b'};
        }
    `;

    // Initialize Playground
    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup previous instance if it exists to avoid duplication
        if (playgroundRef.current) {
            try {
                playgroundRef.current.destroy();
            } catch (e) { }
            playgroundRef.current = null;
        }

        let isMounted = true;

        const initPlayground = async () => {
            const options = {
                appUrl: 'https://v29.livecodes.io/',
                params: {
                    console: 'open',
                    mode: 'result',
                    loading: 'eager',
                    embed: true,
                },
                config: {
                    title: "React Component",
                    mode: "result",
                    theme: theme,
                    markup: {
                        language: "html",
                        content: '<div id="app"></div>'
                    },
                    script: {
                        language: "tsx", 
                        content: prepareCode(code)
                    },
                    style: {
                        language: "css",
                        content: getBaseStyles(theme)
                    },
                    processors: ["tailwindcss"],
                    imports: {
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
                    },
                    customSettings: {
                        template: "react"
                    }
                }
            };

            try {
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
                try {
                    playgroundRef.current.destroy();
                } catch (e) { }
                playgroundRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Dynamic Code Update
    useEffect(() => {
        if (!isReady || !playgroundRef.current) return;

        playgroundRef.current.setConfig({
            ...playgroundRef.current.getConfig(),
            script: {
                language: "tsx",
                content: prepareCode(code)
            }
        });
    }, [code, isReady]);

    // Dynamic Theme Update
    useEffect(() => {
        if (!isReady || !playgroundRef.current) return;

        playgroundRef.current.setConfig({
            ...playgroundRef.current.getConfig(),
            theme: theme,
            style: {
                language: "css",
                content: getBaseStyles(theme)
            }
        });
    }, [theme, isReady]);

    return (
        <div 
            className="w-full h-full relative group"
            style={{
                borderRadius: mode === 'inline' ? '0' : '0',
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {!isReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#1e1e1e] z-10">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Initializing Environment...</span>
                </div>
            )}
            <div ref={containerRef} className="w-full flex-1 min-h-0 relative" />
        </div>
    );
};

export default SandpackComponent;