
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-1.5 p-3"
      aria-label="AI is thinking"
      role="status"
    >
      <motion.div
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </motion.div>
  );