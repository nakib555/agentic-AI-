
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SandpackProvider, SandpackPreview, SandpackConsole } from "@codesandbox/sandpack-react";

type SandpackComponentProps = {
    code: string;
    theme: 'dark' | 'light';
    keyId?: number;
    mode?: 'inline' | 'full';
};

const SandpackComponent: React.FC<SandpackComponentProps> = ({ code, theme, keyId, mode = 'inline' }) => {
    // Ensure App.js exports default for Sandpack to pick it up correctly
    let finalCode = code;
    if (!code.includes('export default')) {
        finalCode = code + '\n\nexport default App;'; 
    }

    const commonDependencies = {
        "lucide-react": "latest",
        "recharts": "latest",
        "framer-motion": "latest",
        "clsx": "latest",
        "tailwind-merge": "latest",
        "date-fns": "latest",
        "react-markdown": "latest",
    };

    return (
        <SandpackProvider
            key={keyId}
            template="react"
            theme={theme}
            files={{ "/App.js": finalCode }}
            customSetup={{
                dependencies: commonDependencies,
            }}
            options={{
                externalResources: ["https://cdn.tailwindcss.com"],
            }}
        >
            {mode === 'inline' ? (
                <div style={{ 
                    height: '100%', 
                    borderRadius: '0.75rem', 
                    border: '1px solid var(--sp-colors-surface2)',
                    backgroundColor: 'transparent',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <SandpackPreview style={{ height: '400px', display: 'block' }} showRefreshButton={true} showOpenInCodeSandbox={false} />
                    <SandpackConsole style={{ height: '150px' }} resetOnPreviewRestart />
                </div>
            ) : (
                <div className="h-full w-full flex flex-col bg-transparent m-0 p-0">
                    <SandpackPreview 
                        style={{ flex: 1, minHeight: 0, height: '100%' }} 
                        showRefreshButton={true} 
                        showOpenInCodeSandbox={false}
                        showNavigator={false}
                    />
                    <div style={{ height: 'auto', maxHeight: '30%', flexShrink: 0, borderTop: '1px solid var(--sp-colors-surface2)', backgroundColor: 'transparent' }}>
                         <SandpackConsole resetOnPreviewRestart />
                    </div>
                </div>
            )}
        </SandpackProvider>
    );
};

export default SandpackComponent;
