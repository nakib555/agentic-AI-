/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

export const ActiveIcon = () => (
  <motion.div key="active" className="relative w-5 h-5 flex items-center justify-center">
    <motion.div
      className="w-3.5 h-3.5 bg-blue-500 dark:bg-blue-400 rounded-full"
      animate={{ scale: [1, 1.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute inset-0 w-full h-full bg-blue-400 dark:bg-blue-500/50 rounded-full"
      animate={{ scale: [0.8, 2], opacity: [0.6, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
    />
  </motion.div>
);
