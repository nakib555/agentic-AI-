
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
    <div className="w-full flex justify-end group/userMsg pb-2">
        <div className="w-fit max-w-[85%] sm:max-w-[80%] flex flex-col items-end">
            <motion.div 
                {...animationProps} 
                className="bg-message-user text-content-primary rounded-2xl rounded-tr-md shadow-sm border border-border-subtle origin-bottom-right overflow-hidden relative z-0"
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

            {/* Actions Row - Positioned at bottom right */}
            <div className="flex items-center gap-1 mt-1 mr-1 opacity-0 group-hover/userMsg:opacity-100 transition-opacity duration-200">
                {/* Copy Button */}
                <button 
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-all focus:opacity-100"
                    title="Copy text"
                    aria-label="Copy message text"
                >
                    <AnimatePresence mode='wait' initial={false}>
                        {isCopied ? (
                            <motion.svg 
                                key="check" 
                                initial={{ scale: 0.5, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                exit={{ scale: 0.5, opacity: 0 }} 
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                                className="text-green-500"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </motion.svg>
                        ) : (
                            <motion.svg 
                                key="copy" 
                                initial={{ scale: 0.5, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                exit={{ scale: 0.5, opacity: 0 }} 
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </button>

                {/* Edit Button */}
                <button 
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-all focus:opacity-100"
                    title="Edit and Branch"
                    aria-label="Edit message"
                    onClick={() => alert("Branching feature: This would allow editing this message to fork the conversation.")}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
  );
};
