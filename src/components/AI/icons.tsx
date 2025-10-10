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

export const GoalAnalysisIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM8 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" clipRule="evenodd" />
        </svg>
    </div>
);

export const TodoListIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
        </svg>
    </div>
);

export const ToolsIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.013 3.69a.75.75 0 0 1 .75.75v2.036a.75.75 0 0 1-.22.53l-3.25 3.25a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 .53-.22H11.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            <path d="M4.68 8.15a1.5 1.5 0 0 0-2.12-.128l-1.424 1.138a.75.75 0 0 0 0 1.18l1.424 1.138a1.5 1.5 0 0 0 2.12-.128l7.29-9.113a1.5 1.5 0 0 0 .128-2.12l-1.138-1.424a.75.75 0 0 0-1.18 0l-1.138 1.424a1.5 1.5 0 0 0 .128 2.12l-4.114 5.143Z" />
        </svg>
    </div>
);