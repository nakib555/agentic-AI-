/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

// Define monaco on window for TypeScript
declare global {
  interface Window {
    monaco: any; 
  }
}

// Define a more comprehensive map for language aliases. This helps ensure that common
// markdown language tags are correctly mapped to Monaco's language identifiers for syntax highlighting.
const monacoLanguageMap: { [key: string]: string } = {
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


type CodeBlockProps = {
    language?: string;
    children: React.ReactNode;
};

// FIX: Updated component definition to use React.FC. This correctly types the component
// to accept special React props like 'key', resolving the type error when this
// component is rendered inside a list.
export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null); // To hold the editor instance
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
  
    useEffect(() => {
        // This effect handles creating, updating, and destroying the editor instance.
        let editor: any = null; // monaco editor instance

        const setupMonaco = () => {
            if (editorRef.current && window.monaco) {
                const rawLanguage = language ? language.toLowerCase() : 'plaintext';
                const monacoLang = monacoLanguageMap[rawLanguage] || rawLanguage;
                
                const effectiveTheme = theme === 'system' 
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;

                editor = window.monaco.editor.create(editorRef.current, {
                    value: codeContent,
                    language: monacoLang,
                    theme: effectiveTheme === 'dark' ? 'vs-dark' : 'vs',
                    readOnly: true,
                    domReadOnly: true,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    contextmenu: false,
                    fontSize: 13,
                    fontFamily: "'Fira Code', monospace",
                    padding: { top: 16, bottom: 16 },
                    scrollbar: {
                        alwaysConsumeMouseWheel: false,
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                });
                editorInstanceRef.current = editor;

                const updateHeight = () => {
                    if (editorInstanceRef.current && editorRef.current) {
                        const contentHeight = editorInstanceRef.current.getContentHeight();
                        const newHeight = Math.min(600, contentHeight); // Max height of 600px
                        
                        requestAnimationFrame(() => {
                            if (editorRef.current) {
                                editorRef.current.style.height = `${newHeight}px`;
                            }
                        });
                    }
                };
                
                editor.onDidContentSizeChange(updateHeight);
                updateHeight();
            }
        };
        
        if (window.monaco) {
            setupMonaco();
        } else {
            // If monaco is not loaded yet, add a one-time listener.
            window.addEventListener('monaco-loaded', setupMonaco, { once: true });
        }

        return () => {
            // Cleanup function to run when the component unmounts or dependencies change.
            window.removeEventListener('monaco-loaded', setupMonaco);
            if (editor) {
                editor.dispose();
                editorInstanceRef.current = null;
            }
        };
    }, [language, codeContent, theme]); // Re-run effect if language, content, or theme changes.
    
    const formattedLanguage = language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code';

    return (
      <div className="my-4 rounded-lg text-sm overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/30 bg-[#1e1e1e]">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-[#171717] border-b border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            {formattedLanguage}
          </span>
          <button
            onClick={handleCopy}
            aria-label={isCopied ? 'Copied!' : 'Copy code'}
            className="flex items-center space-x-2 p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-150 active:scale-95"
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
        <div ref={editorRef} style={{ height: 'auto' }}></div>
      </div>
    );
  };