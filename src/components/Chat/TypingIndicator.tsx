
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

export const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center px-4 py-3"
      aria-label="AI is thinking"
      role="status"
    >
      <div className="flex items-center gap-3">
        {/* Animated dot pulse */}
        <div className="flex space-x-1">
             <motion.div 
                 className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                 transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0 }} 
             />
             <motion.div 
                 className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                 transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} 
             />
             <motion.div 
                 className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                 transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} 
             />
        </div>
        
        {/* Shining Wave Text */}
        <span className="text-sm font-medium shimmer-text select-none tracking-wide">
          Thinking...
        </span>
      </div>
    </motion.div>
  );
