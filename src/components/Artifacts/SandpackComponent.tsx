/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPlayground } from 'livecodes';

type SandpackComponentProps = {
    code: string;
    theme: 'dark' | 'light';
    keyId?: number;
    mode?: 'inline' | 'full';
};

const SandpackComponent: React.FC<SandpackComponentProps> = ({ code, theme, keyId, mode = 'inline' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playgroundRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let finalCode = code;
        // Ensure React code exports properly for LiveCodes
        if (!code.includes('export default')) {
            finalCode = code + '\n\nexport default App;'; 
        }

        const run = async () => {
            if (playgroundRef.current) {
                playgroundRef.current.destroy();
            }

            const playground = await createPlayground(containerRef.current!, {
                appUrl: 'https://v29.livecodes.io/',
                params: {
                    console: 'open',
                    mode: 'result',
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
                            body { font-family: 'Inter', sans-serif; padding: 1rem; } 
                            ${theme === 'dark' ? 'body { background-color: #1e1e1e; color: #fff; }' : ''}
                        `
                    },
                    processors: ["tailwindcss"],
                    imports: {
                        "react": "https://esm.sh/react@18.2.0",
                        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
                        "lucide-react": "https://esm.sh/lucide-react",
                        "recharts": "https://esm.sh/recharts",
                        "framer-motion": "https://esm.sh/framer-motion",
                        "clsx": "https://esm.sh/clsx",
                        "tailwind-merge": "https://esm.sh/tailwind-merge",
                        "date-fns": "https://esm.sh/date-fns",
                        "react-markdown": "https://esm.sh/react-markdown",
                    },
                    customSettings: {
                        template: "react"
                    }
                }
            });
            playgroundRef.current = playground;
        };

        run();

        return () => {
            if (playgroundRef.current) {
                playgroundRef.current.destroy();
            }
        };
    }, [keyId, theme]); 

    // Dynamic code update
    useEffect(() => {
        if (playgroundRef.current && code) {
            let finalCode = code;
            if (!code.includes('export default')) {
                finalCode = code + '\n\nexport default App;'; 
            }
            
            playgroundRef.current.setConfig({
                ...playgroundRef.current.getConfig(),
                script: {
                    language: 'tsx',
                    content: finalCode
                }
            });
        }
    }, [code]);

    return (
        <div 
            className="w-full h-full"
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
            <div ref={containerRef} style={{ width: '100%', flex: 1, minHeight: 0 }} />
        </div>
    );
};

export default SandpackComponent;
