/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { MarkdownComponents } from '../Markdown/markdownComponents';
import type { Message } from '../../types';
import { FileIcon } from '../UI/FileIcon';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const UserMessage = ({ msg }: { msg: Message }) => {
  const { text, attachments } = msg;
  return (
    <motion.div {...animationProps} className="w-full flex justify-end">
      <div className="markdown-content-user max-w-[85%] sm:max-w-2xl w-fit p-3 sm:p-4 rounded-2xl bg-teal-600 text-white rounded-br-none shadow-sm break-words">
        {attachments && attachments.length > 0 && (
            <div className="flex flex-col gap-2 p-2 mb-2 bg-teal-700/50 rounded-lg">
                {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <FileIcon filename={attachment.name} className="flex-shrink-0 w-5 h-5" />
                        <span className="truncate text-sm font-medium" title={attachment.name}>{attachment.name}</span>
                    </div>
                ))}
            </div>
        )}
        {text && (
            <ManualCodeRenderer text={text} components={MarkdownComponents} />
        )}
      </div>
    </motion.div>
  );
};