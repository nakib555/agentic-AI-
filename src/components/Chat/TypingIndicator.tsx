
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

export const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 ml-1"
      aria-label="AI is thinking"
      role="status"
    >
      {/* Subtle Spinner Circle */}
      <div className="relative w-4 h-4 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 dark:border-indigo-400/20"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 dark:border-indigo-400 animate-spin"></div>
      </div>

      {/* Shimmering Text */}
      <span className="text-sm font-medium shimmer-text select-none">
        Thinking...
      </span>
    </motion.div>
  );
