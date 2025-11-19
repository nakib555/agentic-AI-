
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

const animationProps = {
  initial: { opacity: 0, y: 15, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 400, damping: 30 },
};


export const UserMessage = ({ msg }: { msg: Message }) => {
  const { text, attachments } = msg;
  
  return (
    <div className="w-full flex justify-end">
        <div className="w-fit max-w-[75%] flex flex-col items-end">
            <motion.div 
                {...animationProps} 
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700/50 origin-bottom-right"
            >
                {/* Content Section */}
                <div className="p-4 flex flex-col gap-4">
                    {attachments && attachments.length > 0 && (
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-slate-700/50">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <FileIcon filename={attachment.name} className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-slate-400" />
                                    <span className="truncate text-sm font-medium text-gray-700 dark:text-slate-300" title={attachment.name}>{attachment.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <div className="markdown-content">
                            <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    </div>
  );
};
