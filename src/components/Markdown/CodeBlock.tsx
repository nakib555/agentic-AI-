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
      <div className="my-6 rounded-lg text-sm overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/30 bg-gray-50 dark:bg-[#1e1e1e]">
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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500"><path d="M15.1883 5.10908C15.3699 4.96398 15.6346 4.96153 15.8202 5.11592C16.0056 5.27067 16.0504 5.53125 15.9403 5.73605L15.8836 5.82003L8.38354 14.8202C8.29361 14.9279 8.16242 14.9925 8.02221 14.9989C7.88203 15.0051 7.74545 14.9526 7.64622 14.8534L4.14617 11.3533L4.08172 11.2752C3.95384 11.0811 3.97542 10.817 4.14617 10.6463C4.31693 10.4755 4.58105 10.4539 4.77509 10.5818L4.85321 10.6463L7.96556 13.7586L15.1161 5.1794L15.1883 5.10908Z"></path></svg>
                    </motion.div>
                ) : (
                    <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M10 1.5C11.1097 1.5 12.0758 2.10424 12.5947 3H14.5C15.3284 3 16 3.67157 16 4.5V16.5C16 17.3284 15.3284 18 14.5 18H5.5C4.67157 18 4 17.3284 4 16.5V4.5C4 3.67157 4.67157 3 5.5 3H7.40527C7.92423 2.10424 8.89028 1.5 10 1.5ZM5.5 4C5.22386 4 5 4.22386 5 4.5V16.5C5 16.7761 5.22386 17 5.5 17H14.5C14.7761 17 15 16.7761 15 16.5V4.5C15 4.22386 14.7761 4 14.5 4H12.958C12.9853 4.16263 13 4.32961 13 4.5V5.5C13 5.77614 12.7761 6 12.5 6H7.5C7.22386 6 7 5.77614 7 5.5V4.5C7 4.32961 7.0147 4.16263 7.04199 4H5.5ZM12.54 13.3037C12.6486 13.05 12.9425 12.9317 13.1963 13.04C13.45 13.1486 13.5683 13.4425 13.46 13.6963C13.1651 14.3853 12.589 15 11.7998 15C11.3132 14.9999 10.908 14.7663 10.5996 14.4258C10.2913 14.7661 9.88667 14.9999 9.40039 15C8.91365 15 8.50769 14.7665 8.19922 14.4258C7.89083 14.7661 7.48636 15 7 15C6.72386 15 6.5 14.7761 6.5 14.5C6.5 14.2239 6.72386 14 7 14C7.21245 14 7.51918 13.8199 7.74023 13.3037L7.77441 13.2373C7.86451 13.0913 8.02513 13 8.2002 13C8.40022 13.0001 8.58145 13.1198 8.66016 13.3037C8.88121 13.8198 9.18796 14 9.40039 14C9.61284 13.9998 9.9197 13.8197 10.1406 13.3037L10.1748 13.2373C10.2649 13.0915 10.4248 13.0001 10.5996 13C10.7997 13 10.9808 13.1198 11.0596 13.3037C11.2806 13.8198 11.5874 13.9999 11.7998 14C12.0122 14 12.319 13.8198 12.54 13.3037ZM12.54 9.30371C12.6486 9.05001 12.9425 8.93174 13.1963 9.04004C13.45 9.14863 13.5683 9.44253 13.46 9.69629C13.1651 10.3853 12.589 11 11.7998 11C11.3132 10.9999 10.908 10.7663 10.5996 10.4258C10.2913 10.7661 9.88667 10.9999 9.40039 11C8.91365 11 8.50769 10.7665 8.19922 10.4258C7.89083 10.7661 7.48636 11 7 11C6.72386 11 6.5 10.7761 6.5 10.5C6.5 10.2239 6.72386 10 7 10C7.21245 10 7.51918 9.8199 7.74023 9.30371L7.77441 9.2373C7.86451 9.09126 8.02513 9 8.2002 9C8.40022 9.00008 8.58145 9.11981 8.66016 9.30371C8.88121 9.8198 9.18796 10 9.40039 10C9.61284 9.99978 9.9197 9.81969 10.1406 9.30371L10.1748 9.2373C10.2649 9.09147 10.4248 9.00014 10.5996 9C10.7997 9 10.9808 9.11975 11.0596 9.30371C11.2806 9.8198 11.5874 9.99989 11.7998 10C12.0122 10 12.319 9.81985 12.54 9.30371ZM10 2.5C8.89543 2.5 8 3.39543 8 4.5V5H12V4.5C12 3.39543 11.1046 2.5 10 2.5Z"></path></svg>
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
                    padding: '0.9rem',
                    backgroundColor: 'transparent',
                    fontSize: '1rem',
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