/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackConsole, 
  useSandpackConsole
} from "@codesandbox/sandpack-react";

type SandpackComponentProps = {
    code: string;
    theme: 'dark' | 'light';
    keyId?: number;
    mode?: 'inline' | 'full';
};

const SandpackInner = ({ mode }: { mode: 'inline' | 'full' }) => {
    const [consoleExpanded, setConsoleExpanded] = useState(false);
    const { logs } = useSandpackConsole({ resetOnPreviewRestart: true });
    
    // Count distinct log types for the badge
    const errorCount = logs.filter(log => log.method === 'error').length;
    const warningCount = logs.filter(log => log.method === 'warn').length;
    const infoCount = logs.filter(log => log.method === 'log' || log.method === 'info').length;

    // Auto-expand console if a new error is detected
    useEffect(() => {
        if (errorCount > 0) {
            setConsoleExpanded(true);
        }
    }, [errorCount]);

    return (
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
                style={{ height: '100%', flex: 1, minHeight: 0 }} 
                showRefreshButton={true} 
                showOpenInCodeSandbox={false}
                showNavigator={false}
            />
            
            {/* Collapsible Console Footer */}
            <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-gray-700 flex flex-col w-full">
                 <div className="flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-black/20 text-xs font-mono text-gray-400 select-none h-7">
                    <button 
                        onClick={() => setConsoleExpanded(!consoleExpanded)} 
                        className="flex items-center gap-2 hover:text-white transition-colors focus:outline-none w-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-200 ${consoleExpanded ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <span>Console</span>
                        {(errorCount > 0 || warningCount > 0 || infoCount > 0) && (
                            <div className="flex gap-1 ml-auto">
                                {errorCount > 0 && <span className="bg-red-900/50 text-red-300 px-1.5 rounded text-[10px] font-bold">{errorCount}</span>}
                                {warningCount > 0 && <span className="bg-yellow-900/50 text-yellow-300 px-1.5 rounded text-[10px] font-bold">{warningCount}</span>}
                                {infoCount > 0 && <span className="bg-gray-700 text-gray-300 px-1.5 rounded text-[10px] font-bold">{infoCount}</span>}
                            </div>
                        )}
                    </button>
                </div>
                
                <div 
                    style={{ 
                        height: consoleExpanded ? '160px' : '0px', 
                        transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden' 
                    }}
                >
                    <SandpackConsole 
                        style={{ height: '100%', width: '100%' }} 
                        resetOnPreviewRestart 
                    />
                </div>
            </div>
        </SandpackLayout>
    );
};

const SandpackComponent: React.FC<SandpackComponentProps> = ({ code, theme, keyId, mode = 'inline' }) => {
    // Ensure App.js exports default for Sandpack to pick it up correctly
    let finalCode = code;
    if (!code.includes('export default')) {
        finalCode = code + '\n\nexport default App;'; 
    }

    const files = {
        "/App.js": finalCode
    };

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
            files={files}
            customSetup={{
                dependencies: commonDependencies,
            }}
            options={{
                externalResources: ["https://cdn.tailwindcss.com"],
                // This ensures errors are captured by useSandpackConsole
                classes: {
                    "sp-layout": "custom-sandpack-layout",
                }
            }}
        >
            <SandpackInner mode={mode as 'inline' | 'full'} />
        </SandpackProvider>
    );
};

export default SandpackComponent;