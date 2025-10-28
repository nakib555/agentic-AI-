/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import type { Message } from '../../../types';
import { FileIcon } from '../UI/FileIcon';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { PinButton } from './PinButton';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const UserMessage = ({ msg, currentChatId, onTogglePin }: { msg: Message, currentChatId: string | null, onTogglePin: (chatId: string, messageId: string) => void }) => {
  const { id, text, attachments, isPinned } = msg;
  
  return (
    <div className="w-full flex justify-end">
        <div className="relative group flex items-center gap-2">
            <div className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <PinButton
                    isPinned={!!isPinned}
                    onClick={() => {
                        if (currentChatId) {
                            onTogglePin(currentChatId, id);
                        }
                    }}
                />
            </div>
            <motion.div {...animationProps} className="markdown-content-user max-w-full w-fit p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg break-words flex flex-col">
                {attachments && attachments.length > 0 && (
                    <div className="flex flex-col gap-2 p-2 mb-2 bg-black/20 rounded-lg">
                        {attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <FileIcon filename={attachment.name} className="flex-shrink-0 w-5 h-5" />
                                <span className="truncate text-sm font-medium" title={attachment.name}>{attachment.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                {text && (
                    <ManualCodeRenderer text={text} components={MarkdownComponents} isStreaming={false} />
                )}
            </motion.div>
        </div>
    </div>
  );
};