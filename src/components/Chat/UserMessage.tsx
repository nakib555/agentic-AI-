
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
                className="bg-message-user text-content-primary rounded-xl shadow-sm border border-border-subtle origin-bottom-right overflow-hidden"
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
                                            {/* Hover info */}
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
