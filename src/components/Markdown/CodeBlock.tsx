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

const monacoLanguageMap: { [key: string]: string } = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    jsx: 'javascript', // Monaco treats JSX as JS
    tsx: 'typescript', // Monaco treats TSX as TS
    shell: 'shell',
    bash: 'shell',
};


export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null); // To hold the editor instance
    const [editorHeight, setEditorHeight] = useState('auto');
    const { theme } = useTheme();

    const match = /language-(\w+)/.exec(className || '');
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
        if (inline) return;

        const initMonaco = () => {
            if (editorRef.current && window.monaco && !editorInstanceRef.current) {
                const rawLanguage = match ? match[1].toLowerCase() : 'plaintext';
                const monacoLang = monacoLanguageMap[rawLanguage] || rawLanguage;

                const effectiveTheme = theme === 'system' 
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;

                const editor = window.monaco.editor.create(editorRef.current, {
                    value: codeContent,
                    language: monacoLang,
                    theme: effectiveTheme === 'dark' ? 'vs-dark' : 'vs',
                    readOnly: true,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    contextmenu: false,
                    fontSize: 13,
                    fontFamily: "'Fira Code', monospace",
                    padding: { top: 16, bottom: 16 },
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                });

                editorInstanceRef.current = editor;

                const updateHeight = () => {
                    const contentHeight = editor.getContentHeight();
                    const newHeight = Math.min(600, contentHeight); // Max height of 600px
                    setEditorHeight(`${newHeight}px`);
                };
                
                editor.onDidContentSizeChange(updateHeight);
                updateHeight();

                return () => {
                    editor.dispose();
                    editorInstanceRef.current = null;
                };
            }
        };

        let disposeEditor: (() => void) | undefined;
        if (window.monaco) {
            disposeEditor = initMonaco();
        } else {
            window.addEventListener('monaco-loaded', initMonaco, { once: true });
        }

        return () => {
            disposeEditor?.();
            window.removeEventListener('monaco-loaded', initMonaco);
        };
    }, []); // Run only once on mount

     // Effect to update theme
     useEffect(() => {
        if (editorInstanceRef.current && window.monaco) {
            const effectiveTheme = theme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;
            window.monaco.editor.setTheme(effectiveTheme === 'dark' ? 'vs-dark' : 'vs');
        }
    }, [theme]);
  
    if (inline) {
      return <code className="inline-code" {...props}>{children}</code>;
    }
    
    return (
      <div className="my-4 rounded-lg text-sm overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/30 bg-[#1e1e1e]">
        <div className="flex justify-end items-center px-4 py-2 bg-slate-100 dark:bg-[#171717] border-b border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
          <button
            onClick={handleCopy}
            aria-label={isCopied ? 'Copied!' : 'Copy code'}
            className="flex items-center space-x-2 p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
        <div ref={editorRef} style={{ height: editorHeight, transition: 'height 0.2s ease-out' }}></div>
      </div>
    );
  };