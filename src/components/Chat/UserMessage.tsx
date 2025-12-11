
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
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
  
  return (
    <div className="w-full flex justify-end">
        <div className="w-fit max-w-[80%] flex flex-col items-end">
            <motion.div 
                {...animationProps} 
                className="bg-message-user text-slate-900 dark:text-white rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 origin-bottom-right overflow-hidden"
                // Performance Fix: Removed 'layout' prop to prevent layout thrashing on message list updates
            >
                {/* Content Section */}
                <div className="px-5 py-3.5 flex flex-col gap-3">
                    {attachments && attachments.length > 0 && (
                        <div className="flex flex-col gap-2 p-2 bg-white dark:bg-black/20 rounded-lg border border-gray-200/50 dark:border-white/5">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <FileIcon filename={attachment.name} className="flex-shrink-0 w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                                    <span className="truncate text-sm font-medium text-slate-700 dark:text-white" title={attachment.name}>{attachment.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <div className="markdown-content markdown-content-user text-base leading-relaxed">
                            <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    </div>
  );
};
