
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sandpack, SandpackProps } from "@codesandbox/sandpack-react";

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
        if ((l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript') && (codeContent.includes('React') || codeContent.includes('export default'))) {
            return 'react-ts';
        }
        return 'vanilla-ts';
    };

    const template = getTemplate(language, code);

    // Prepare files based on template
    const getFiles = () => {
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
            <Sandpack
                template={template}
                theme={theme === 'dark' ? 'dark' : 'light'}
                files={getFiles()}
                options={{
                    showNavigator: false,
                    showTabs: false,
                    showLineNumbers: true, // Show line numbers in the editor part if visible
                    editorHeight: '100%',
                    classes: {
                        "sp-wrapper": "h-full",
                        "sp-layout": "h-full",
                        "sp-stack": "h-full",
                    }
                }}
                customSetup={{
                    dependencies: {
                        "lucide-react": "latest",
                        "recharts": "latest",
                        "framer-motion": "latest",
                        "clsx": "latest",
                        "tailwind-merge": "latest",
                        "date-fns": "latest",
                        "react-markdown": "latest",
                        "lodash": "latest"
                    }
                }}
            />
            <style>{`
                .sandpack-container .sp-wrapper { height: 100%; }
                .sandpack-container .sp-layout { height: 100%; border: none; border-radius: 0; }
                .sandpack-container .sp-preview-iframe { height: 100%; }
            `}</style>
        </div>
    );
};

export default SandpackComponent;
