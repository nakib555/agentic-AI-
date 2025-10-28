/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type ProactiveAssistanceProps = {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
};

export const ProactiveAssistance: React.FC<ProactiveAssistanceProps> = ({ suggestions, onSuggestionClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="px-2 pb-2"
    >
      <div className="bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 px-1">Proactive Assistance</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 rounded-full border border-gray-200 dark:border-slate-600/80"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};