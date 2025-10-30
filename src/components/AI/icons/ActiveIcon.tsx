/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

export const ActiveIcon = () => (
  <motion.div key="active" className="relative w-5 h-5 flex items-center justify-center">
    <motion.div
      className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute inset-0 w-full h-full bg-blue-400/50 dark:bg-blue-500/30 rounded-full"
      animate={{ scale: [0.8, 1.8], opacity: [0.8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
    />
  </motion.div>
);
