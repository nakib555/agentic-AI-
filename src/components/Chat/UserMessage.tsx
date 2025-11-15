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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};


export const UserMessage = ({ msg }: { msg: Message }) => {
  const { text, attachments } = msg;
  
  return (
    <div className="w-full flex justify-end">
        <div className="w-fit max-w-[85%] flex flex-col items-end">
            <motion.div 
                {...animationProps} 
                className="bg-blue-600 dark:bg-blue-700 text-white rounded-2xl rounded-br-lg shadow-md"
            >
                {/* Content Section */}
                <div className="p-4 flex flex-col gap-4">
                    {attachments && attachments.length > 0 && (
                        <div className="flex flex-col gap-2 p-3 bg-blue-700/50 dark:bg-blue-800/50 rounded-lg border border-blue-500/50">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <FileIcon filename={attachment.name} className="flex-shrink-0 w-5 h-5 text-blue-200" />
                                    <span className="truncate text-sm font-medium text-blue-100" title={attachment.name}>{attachment.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <div className="markdown-content-user">
                            <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    </div>
  );
};