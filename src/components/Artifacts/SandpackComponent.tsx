
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackConsole } from "@codesandbox/sandpack-react";

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
            <SandpackLayout style={{ 
                height: '100%', 
                border: 'none', 
                borderRadius: mode === 'inline' ? '0.75rem' : '0', 
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <SandpackPreview 
                    style={{ height: mode === 'inline' ? '400px' : '100%', flex: 1 }} 
                    showRefreshButton={true} 
                    showOpenInCodeSandbox={false}
                    showNavigator={false}
                />
                <SandpackConsole 
                    style={{ height: mode === 'inline' ? '150px' : 'auto', maxHeight: mode === 'full' ? '30%' : undefined, flexShrink: 0 }} 
                    resetOnPreviewRestart 
                />
            </SandpackLayout>
        </SandpackProvider>
    );
};

export default SandpackComponent;
