/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

const Wave = () => (
    <div className="flex items-center justify-center gap-1.5 h-4 w-12">
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                animate={{
                    y: [0, -5, 0, 3, 0],
                    opacity: [0.5, 1, 0.5, 0.8, 0.5],
                    scale: [1, 1.3, 1, 0.8, 1],
                    boxShadow: [
                        "0 0 2px rgba(99, 102, 241, 0)", 
                        "0 0 10px rgba(99, 102, 241, 0.7)", 
                        "0 0 2px rgba(99, 102, 241, 0)",
                        "0 0 6px rgba(129, 140, 248, 0.5)",
                        "0 0 2px rgba(99, 102, 241, 0)"
                    ]
                }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.12,
                }}
            />
        ))}
    </div>
);


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
      {/* Strong bright shining wave */}
      <Wave />

      {/* Shimmering Text */}
      <span className="text-sm font-medium shimmer-text select-none">
        Thinking...
      </span>
    </motion.div>
  );