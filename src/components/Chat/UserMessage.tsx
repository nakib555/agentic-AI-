
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
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 260, damping: 20 },
};

export const UserMessage = ({ msg }: { msg: Message }) => {
  const { text, attachments } = msg;
  
  return (
    <div className="w-full flex justify-end pl-8 sm:pl-16">
        <div className="flex flex-col items-end max-w-full">
            <motion.div 
                {...animationProps} 
                className="
                    relative
                    bg-gradient-to-br from-primary-main to-primary-hover
                    text-white
                    rounded-2xl rounded-tr-md
                    shadow-md
                    border border-white/10
                    overflow-hidden
                "
                style={{ willChange: 'transform, opacity' }}
            >
                {/* Content Section */}
                <div className="p-4 flex flex-col gap-3">
                    {attachments && attachments.length > 0 && (
                        <div className="flex flex-col gap-2 p-2 bg-black/10 rounded-xl border border-white/10">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-3 p-1">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <FileIcon filename={attachment.name} className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="truncate text-xs font-medium text-white/90" title={attachment.name}>{attachment.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <div className="markdown-content markdown-content-user text-[15px] leading-relaxed selection:bg-white/30">
                            <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    </div>
  );
};
