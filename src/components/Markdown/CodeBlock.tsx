
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


// Define a more comprehensive map for language aliases.
const languageMap: { [key: string]: string } = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    shell: 'shell',
    bash: 'shell',
    sh: 'shell',
    html: 'html',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'csharp',
    go: 'go',
    rust: 'rust',
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
        }).catch(err => {
            console.error('Failed to copy code: ', err);
        });
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
    const formattedLanguage = language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code';
    const isRunnable = onRunCode && runnableLanguages.includes(rawLanguage);

    return (
      <div className="my-6 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#09090b] shadow-sm group">
        <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 select-none font-mono">
            {formattedLanguage}
          </span>
          <div className="flex items-center space-x-2">
            {isRunnable && (
                <button
                    onClick={handleRun}
                    disabled={isDisabled}
                    aria-label="Run code"
                    title="Run code"
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>
                    Run
                </button>
            )}
            <button
                onClick={handleCopy}
                aria-label={isCopied ? 'Copied!' : 'Copy code'}
                title={isCopied ? 'Copied!' : 'Copy code'}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
                <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                    <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </motion.div>
                ) : (
                    <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </motion.div>
                )}
                </AnimatePresence>
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
            <SyntaxHighlighter
              language={highlighterLang}
              style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
              customStyle={{
                margin: 0,
                padding: '1.25rem',
                backgroundColor: 'transparent',
                fontSize: '0.875rem', 
                lineHeight: '1.6',
                fontFamily: "'Fira Code', monospace",
              }}
              codeTagProps={{
                  style: {
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      lineHeight: "inherit",
                  }
              }}
              wrapLines={true}
              wrapLongLines={true}
            >
              {codeContent}
            </SyntaxHighlighter>
        </div>
      </div>
    );
  };
