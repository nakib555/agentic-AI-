
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import hljs from 'highlight.js';

type CodeBlockProps = {
    language?: string;
    children: React.ReactNode;
    isStreaming: boolean;
    onRunCode?: (language: string, code: string) => void;
    isDisabled?: boolean;
};

// Common languages that support execution in this app context
const runnableLanguages = ['javascript', 'js', 'jsx', 'python', 'py', 'typescript', 'ts', 'tsx'];

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children, isStreaming, onRunCode, isDisabled }) => {
    const [isCopied, setIsCopied] = useState(false);

    const codeContent = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        if (!codeContent) return;
        navigator.clipboard.writeText(codeContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error('Failed to copy code: ', err));
    };
    
    const handleRun = () => {
      if (onRunCode && language && codeContent) {
        onRunCode(language, codeContent);
      }
    };

    const handleOpenArtifact = () => {
        // Dispatch event for AppLogic to catch
        window.dispatchEvent(new CustomEvent('open-artifact', { 
            detail: { code: codeContent, language: language || 'plaintext' } 
        }));
    };
    
    const formattedLanguage = language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Auto';
    const isRunnable = onRunCode && language && runnableLanguages.includes(language.toLowerCase());

    const highlightedCode = useMemo(() => {
        try {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(codeContent, { language }).value;
            }
            // Auto detect
            return hljs.highlightAuto(codeContent).value;
        } catch (e) {
            console.warn('Highlight.js failed:', e);
            // Fallback to simple escaping if highlighting fails
            return codeContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
    }, [codeContent, language]);

    return (
      <div className="my-6 rounded-xl overflow-hidden border border-border-default bg-code-surface shadow-sm font-sans group">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-layer-2/50 border-b border-border-subtle select-none">
          <div className="flex items-center gap-3">
             <span className="text-xs font-semibold text-content-tertiary lowercase font-mono">
                {formattedLanguage}
             </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
                onClick={handleOpenArtifact}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-primary-main hover:bg-primary-subtle transition-all"
                title="Open in Side Panel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M15.28 9.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L13.69 10 9.97 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25ZM6.03 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.69 10 5.97 6.28a.75.75 0 0 1 .06-1.06Z" clipRule="evenodd" /></svg>
                Open
            </button>

            {isRunnable && (
                <button
                    onClick={handleRun}
                    disabled={isDisabled}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-primary-main hover:bg-primary-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>
                    Run
                </button>
            )}
            
            <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-layer-3 transition-all"
                aria-label="Copy code"
            >
                {isCopied ? (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-status-success-text"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span className="text-status-success-text">Copied</span>
                    </>
                ) : (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>Copy</span>
                    </>
                )}
            </button>
          </div>
        </div>
        
        {/* Editor Body */}
        <div className="relative overflow-x-auto text-[13px] leading-6 scrollbar-thin text-code-text bg-[#282c34]">
            <pre className="m-0 p-5 bg-transparent font-mono">
                <code 
                    className={`hljs ${language ? `language-${language}` : ''}`} 
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    style={{ background: 'transparent', padding: 0 }}
                />
            </pre>
        </div>
      </div>
    );
};
