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
      className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"
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

export const CompletedIcon = () => (
  <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-green-500 dark:text-green-400">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
  </motion.div>
);

export const FailedIcon = () => (
  <motion.div key="failed" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-red-500 dark:text-red-400">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
  </motion.div>
);

export const GoalAnalysisIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a5.523 5.523 0 0 0-1.503 1.334c-.792.792-1.247 1.87-1.247 2.985v.253a.75.75 0 0 0 1.5 0v-.253c0-.8.316-1.55.879-2.113a4.023 4.023 0 0 1 2.113-.879H7.75V2.75Z" />
            <path d="M12.25 2.75a.75.75 0 0 1 1.5 0v1.258a5.523 5.523 0 0 1 1.503 1.334c.792.792 1.247 1.87 1.247 2.985v.253a.75.75 0 0 1-1.5 0v-.253c0-.8-.316-1.55-.879-2.113a4.023 4.023 0 0 0-2.113-.879H12.25V2.75Z" />
            <path fillRule="evenodd" d="M17 10c0-2.036-1.289-3.796-3.085-4.482A5.526 5.526 0 0 0 10 3.5a5.526 5.526 0 0 0-3.915 1.018C4.289 6.204 3 7.964 3 10c0 2.036 1.289 3.796 3.085 4.482A5.526 5.526 0 0 0 10 16.5a5.526 5.526 0 0 0 3.915-1.018C15.711 13.796 17 12.036 17 10ZM10 5a4.026 4.026 0 0 1 2.848.742A4.49 4.49 0 0 1 15.5 10a4.49 4.49 0 0 1-2.652 4.258A4.026 4.026 0 0 1 10 15a4.026 4.026 0 0 1-2.848-.742A4.49 4.49 0 0 1 4.5 10a4.49 4.49 0 0 1 2.652-4.258A4.026 4.026 0 0 1 10 5Z" clipRule="evenodd" />
            <path d="M7.75 12.25a.75.75 0 0 0-1.5 0v.253c0 1.114.455 2.193 1.247 2.985a5.523 5.523 0 0 0 1.503 1.334V18a.75.75 0 0 0 1.5 0v-1.178a4.023 4.023 0 0 1-2.113-.879.75.75 0 0 1-.879-2.113V12.25Z" />
            <path d="M12.25 12.25a.75.75 0 0 1 1.5 0v.253c0 1.114-.455 2.193-1.247 2.985a5.523 5.523 0 0 1-1.503 1.334V18a.75.75 0 0 1-1.5 0v-1.178a4.023 4.023 0 0 0 2.113-.879c.563-.564.879-1.314.879-2.113V12.25Z" />
        </svg>
    </div>
);

export const TodoListIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 4a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 10 4ZM8.75 6.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5ZM7 10.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
        </svg>
    </div>
);

export const ToolsIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 3.5a1.5 1.5 0 0 1 3 0V4a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1.172a3 3 0 0 0-2.121.879l-4.414 4.414A3 3 0 0 1 8.828 16H6a1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.121-.879l4.414-4.414A3 3 0 0 1 11.172 4H10V3.5Z" />
        </svg>
    </div>
);

export const ThoughtIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" />
        </svg>
    </div>
);

export const ObservationIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
        </svg>
    </div>
);

export const SearchIcon = () => (
    <div className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
    </div>
);
