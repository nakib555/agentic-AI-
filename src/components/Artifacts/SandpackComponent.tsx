
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - livecodes is loaded via importmap so types might be missing in dev environment
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

    // Initialize Playground
    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup previous instance if it exists
        if (playgroundRef.current) {
            try {
                playgroundRef.current.destroy();
            } catch (e) {
                // Ignore destruction errors
            }
            playgroundRef.current = null;
        }

        let isMounted = true;

        const initPlayground = async () => {
            // Prepare code: Ensure export default App exists if not present
            let finalCode = code;
            
            // Basic heuristic to ensure the React component renders
            if (!code.includes('export default')) {
                finalCode = code + '\n\nexport default App;';
            }

            const options = {
                appUrl: 'https://v29.livecodes.io/',
                params: {
                    console: 'open',
                    mode: 'result',
                    loading: 'eager',
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
                        content: finalCode
                    },
                    style: {
                        language: "css",
                        content: `
                            body { 
                                font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                                padding: 1rem; 
                                margin: 0;
                            } 
                            ${theme === 'dark' ? 'body { background-color: #1e1e1e; color: #fff; }' : 'body { background-color: #ffffff; color: #1e293b; }'}
                        `
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
    }, [theme]); // Re-init on theme change to ensure clean style switch

    // Dynamic code update (Fast)
    useEffect(() => {
        if (!isReady || !playgroundRef.current) return;

        let finalCode = code;
        if (!code.includes('export default')) {
            finalCode = code + '\n\nexport default App;';
        }

        // LiveCodes allows updating config dynamically without full reload
        playgroundRef.current.setConfig({
            ...playgroundRef.current.getConfig(),
            script: {
                language: "tsx",
                content: finalCode
            }
        });
    }, [code, isReady]);

    return (
        <div 
            className="w-full h-full relative"
            style={{
                borderRadius: mode === 'inline' ? '0.75rem' : '0',
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                border: '1px solid ' + (theme === 'dark' ? '#333' : '#e5e7eb'),
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div ref={containerRef} className="w-full flex-1 min-h-0" />
        </div>
    );
};

export default SandpackComponent;
