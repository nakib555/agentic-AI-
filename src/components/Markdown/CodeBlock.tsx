
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../hooks/useTheme';

const languageMap: { [key: string]: string } = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', shell: 'bash', bash: 'bash', sh: 'bash',
    html: 'html', css: 'css', json: 'json', yaml: 'yaml', yml: 'yaml',
    md: 'markdown', sql: 'sql', java: 'java', c: 'c', cpp: 'cpp',
    csharp: 'csharp', go: 'go', rust: 'rust',
};

const runnableLanguages = ['javascript', 'js', 'jsx', 'python', 'py', 'typescript', 'ts', 'tsx'];

type CodeBlockProps = {
    language?: string;
    children: React.ReactNode;
    isStreaming: boolean;
    onRunCode?: (language: string, code: string) => void;
    isDisabled?: boolean;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children, isStreaming, onRunCode, isDisabled }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { theme } = useTheme();

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
    
    const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    
    const rawLanguage = language ? language.toLowerCase() : 'plaintext';
    const highlighterLang = languageMap[rawLanguage] || rawLanguage;
    const formattedLanguage = language ? language.charAt(0).toUpperCase() + language.slice(1) : '';
    const isRunnable = onRunCode && runnableLanguages.includes(rawLanguage);

    return (
      <div className="my-6 rounded-xl overflow-hidden border border-border-default bg-page dark:bg-code-surface shadow-sm font-sans group">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-layer-2/50 dark:bg-layer-1/50 border-b border-border-subtle select-none">
          <div className="flex items-center gap-3">
             <span className="text-xs font-semibold text-content-tertiary lowercase font-mono">
                {formattedLanguage || 'text'}
             </span>
          </div>
          
          <div className="flex items-center gap-2">
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
        <div className="relative overflow-x-auto text-[13px] leading-6 scrollbar-thin">
            <SyntaxHighlighter
              language={highlighterLang}
              style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
              customStyle={{
                margin: 0,
                padding: '1.25rem',
                backgroundColor: 'transparent', // Let parent bg show through
                fontFamily: "'Fira Code', 'Consolas', monospace",
              }}
              codeTagProps={{
                  style: { fontFamily: "inherit" }
              }}
              wrapLines={true}
              wrapLongLines={false} // Cleaner horizontal scroll
            >
              {codeContent}
            </SyntaxHighlighter>
        </div>
      </div>
    );
  };
