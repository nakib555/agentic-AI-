/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

export const PendingIcon = () => (
  <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
);

export const ActiveIcon = () => (
  <motion.div key="active" className="relative w-5 h-5 flex items-center justify-center">
    <motion.div
      className="w-3 h-3 bg-blue-500 rounded-full"
      animate={{ scale: [1, 1.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute inset-0 w-full h-full bg-blue-400 rounded-full"
      animate={{ scale: [0.8, 2], opacity: [0.6, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
    />
  </motion.div>
);

export const CompletedIcon = () => (
  <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-green-500">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
  </motion.div>
);

export const FailedIcon = () => (
  <motion.div key="failed" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-red-500">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
  </motion.div>
);
