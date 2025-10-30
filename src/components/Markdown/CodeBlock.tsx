/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../hooks/useTheme';


// Define a more comprehensive map for language aliases. This helps ensure that common
// markdown language tags are correctly mapped to the syntax highlighter's language identifiers.
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
      <div className="my-4 rounded-lg text-sm overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/30 bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-[#171717] border-b border-gray-200 dark:border-[rgba(255,255,255,0.08)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            {formattedLanguage}
          </span>
          <div className="flex items-center space-x-2">
            {isRunnable && (
                <button
                    onClick={handleRun}
                    disabled={isDisabled}
                    aria-label="Run code"
                    title="Run code"
                    className="flex items-center space-x-2 p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-150 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2.5 3.55v8.9c0 .868.904 1.43 1.668.99l7.46-4.45a1.25 1.25 0 0 0 0-1.98L4.168 2.56a1.25 1.25 0 0 0-1.668.99Z" /></svg>
                    <span className="text-xs font-medium uppercase tracking-wider">Run Code</span>
                </button>
            )}
            <button
                onClick={handleCopy}
                aria-label={isCopied ? 'Copied!' : 'Copy code'}
                title={isCopied ? 'Copied!' : 'Copy code'}
                className="flex items-center space-x-2 p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-150 active:scale-95 focus:outline-none"
            >
                <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                    <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </motion.div>
                ) : (
                    <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                    </motion.div>
                )}
                </AnimatePresence>
                <span className="text-xs font-medium uppercase tracking-wider">
                    {isCopied ? 'Copied!' : 'Copy code'}
                </span>
            </button>
          </div>
        </div>
        <motion.div
            className="overflow-hidden"
            animate={{ height: 'auto' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className={!isStreaming ? "overflow-y-auto" : ""} style={{ maxHeight: !isStreaming ? '60vh' : undefined }}>
                <SyntaxHighlighter
                  language={highlighterLang}
                  style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                    lineHeight: '1.5',
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
        </motion.div>
      </div>
    );
  };