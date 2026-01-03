
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackProps } from "@codesandbox/sandpack-react";

type SandpackComponentProps = {
    code: string;
    language: string;
    theme: 'dark' | 'light';
    mode?: 'inline' | 'full';
};

const SandpackComponent: React.FC<SandpackComponentProps> = ({ code, language, theme, mode = 'inline' }) => {
    // Map our language to Sandpack templates
    const getTemplate = (lang: string, codeContent: string): SandpackProps['template'] => {
        const l = lang.toLowerCase();
        if (l === 'react' || l === 'jsx' || l === 'tsx') return 'react-ts'; // Default to TS for better support
        if (l === 'vue') return 'vue';
        if (l === 'svelte') return 'svelte';
        if (l === 'angular') return 'angular';
        if (l === 'html') return 'static';
        
        // Fallback for JS/TS if it looks like React
        // Check for common React patterns: explicit import, JSX-like tags, or export default component
        if (
            l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript'
        ) {
             if (
                codeContent.includes('React') || 
                codeContent.includes('export default') ||
                /from\s+['"]react['"]/.test(codeContent) ||
                /require\(['"]react['"]\)/.test(codeContent) ||
                /return\s+<[A-Z]/.test(codeContent) // Heuristic for JSX return
             ) {
                 return 'react-ts';
             }
        }
        return 'vanilla-ts';
    };

    const template = getTemplate(language, code);

    // Prepare files based on template
    const getFiles = (): SandpackProps['files'] => {
        if (template === 'react' || template === 'react-ts') {
            return {
                '/App.tsx': code,
            };
        }
        if (template === 'vue') {
            return {
                '/src/App.vue': code,
            };
        }
        if (template === 'svelte') {
            return {
                '/App.svelte': code,
            };
        }
        if (template === 'static') {
            return {
                '/index.html': code,
            };
        }
        // Vanilla
        return {
            '/index.ts': code,
        };
    };

    return (
        <div className="w-full h-full sandpack-container">
            <SandpackProvider
                template={template}
                theme={theme === 'dark' ? 'dark' : 'light'}
                files={getFiles()}
                options={{
                    classes: {
                        "sp-wrapper": "h-full",
                        "sp-layout": "h-full",
                        "sp-stack": "h-full",
                    },
                    externalResources: ["https://cdn.tailwindcss.com"]
                }}
                customSetup={{
                    dependencies: {
                        "react": "^18.0.0",
                        "react-dom": "^18.0.0",
                        "lucide-react": "latest",
                        "recharts": "latest",
                        "framer-motion": "latest",
                        "clsx": "latest",
                        "tailwind-merge": "latest",
                        "date-fns": "latest",
                        "react-markdown": "latest",
                        "lodash": "latest",
                        "uuid": "latest",
                        "canvas-confetti": "latest",
                        "@radix-ui/react-slot": "latest",
                        "class-variance-authority": "latest"
                    }
                }}
            >
                <SandpackLayout>
                    <SandpackPreview 
                        style={{ height: '100%' }} 
                        showOpenInCodeSandbox={false} 
                        showRefreshButton={true}
                    />
                </SandpackLayout>
            </SandpackProvider>
            <style>{`
                .sandpack-container .sp-wrapper { height: 100%; }
                .sandpack-container .sp-layout { height: 100%; border: none; border-radius: 0; background: transparent; }
                .sandpack-container .sp-preview-iframe { height: 100%; }
                .sandpack-container .sp-preview-container { height: 100%; }
            `}</style>
        </div>
    );
};

export default SandpackComponent;
