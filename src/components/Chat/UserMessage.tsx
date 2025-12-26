
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import { MarkdownComponents } from '../Markdown/markdownComponents';
import type { Message } from '../../types';
import { FileIcon } from '../UI/FileIcon';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';

// Optimized spring physics for performance
const animationProps = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 200, damping: 25 },
};

export const UserMessage = ({ msg }: { msg: Message }) => {
  const { text, attachments } = msg;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => console.error('Failed to copy text: ', err));
  };
  
  return (
    <div className="w-full flex justify-end group/userMsg">
        <div className="w-fit max-w-[85%] sm:max-w-[80%] flex flex-col items-end relative">
            {/* Actions (Always visible) */}
            <div 
                className="absolute top-2 right-full mr-2 flex items-center gap-1 z-10"
            >
                {/* Copy Button */}
                <button 
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 shadow-sm transition-colors backdrop-blur-sm border border-gray-200/50 dark:border-white/5"
                    title="Copy text"
                >
                    <AnimatePresence mode='wait' initial={false}>
                        {isCopied ? (
                            <motion.svg key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </motion.svg>
                        ) : (
                            <motion.svg key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </button>

                {/* Edit Button */}
                <button 
                    type="button"
                    className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 shadow-sm transition-colors backdrop-blur-sm border border-gray-200/50 dark:border-white/5"
                    title="Edit and Branch"
                    onClick={() => alert("Branching feature: This would allow editing this message to fork the conversation.")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                </button>
            </div>

            <motion.div 
                {...animationProps} 
                className="bg-message-user text-content-primary rounded-xl shadow-sm border border-border-subtle origin-bottom-right overflow-hidden relative z-0"
            >
                {/* Content Section */}
                <div className="px-5 py-3.5 flex flex-col gap-3">
                    {attachments && attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-1">
                            {attachments.map((attachment, index) => {
                                const isImage = attachment.mimeType.startsWith('image/');
                                const src = `data:${attachment.mimeType};base64,${attachment.data}`;
                                
                                if (isImage) {
                                    return (
                                        <div key={index} className="relative rounded-lg overflow-hidden border border-border-subtle group">
                                            <img 
                                                src={src} 
                                                alt={attachment.name} 
                                                className="max-h-64 max-w-full object-contain bg-layer-2" 
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <p className="text-xs text-white truncate font-medium">{attachment.name}</p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-layer-1 rounded-lg border border-border-subtle min-w-[200px]">
                                        <FileIcon filename={attachment.name} className="flex-shrink-0 w-8 h-8 text-primary-main" />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium text-content-primary" title={attachment.name}>{attachment.name}</p>
                                            <p className="text-xs text-content-tertiary uppercase">{attachment.mimeType.split('/').pop()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {text && (
                        <div className="markdown-content markdown-content-user text-base leading-relaxed text-content-primary">
                            <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    </div>
  );
};
