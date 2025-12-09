
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
      <div className="my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#09090b] shadow-sm">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 select-none font-mono">
            {formattedLanguage}
          </span>
          <div className="flex items-center space-x-1">
            {isRunnable && (
                <button
                    onClick={handleRun}
                    disabled={isDisabled}
                    aria-label="Run code"
                    title="Run code"
                    className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/20 transition-colors duration-150 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Run</span>
                </button>
            )}
            <button
                onClick={handleCopy}
                aria-label={isCopied ? 'Copied!' : 'Copy code'}
                title={isCopied ? 'Copied!' : 'Copy code'}
                className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-150 active:scale-95 focus:outline-none"
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
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {isCopied ? 'Copied' : 'Copy'}
                </span>
            </button>
          </div>
        </div>
        <motion.div
            className="overflow-hidden"
            animate={{ height: 'auto' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="overflow-x-auto custom-scrollbar">
                <SyntaxHighlighter
                  language={highlighterLang}
                  style={effectiveTheme === 'dark' ? vscDarkPlus : oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    backgroundColor: 'transparent', // Let container bg handle it
                    fontSize: '0.875rem', // 14px
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
        </motion.div>
      </div>
    );
  };
