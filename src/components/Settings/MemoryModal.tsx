/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type MemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memoryContent: string;
  onClearMemory: () => void;
};

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, memoryContent, onClearMemory }) => {
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the AI\'s memory? This cannot be undone.')) {
      onClearMemory();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <h2 id="memory-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                Manage Memory
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20"
                aria-label="Close memory settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                This is a summary of key information the AI has learned from your conversations. Clearing it will reset the AI's memory of your preferences and past discussions.
              </p>
              <textarea
                readOnly
                value={memoryContent || 'Memory is currently empty.'}
                className="w-full min-h-[200px] max-h-64 p-3 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none font-mono resize-none"
                aria-label="AI conversation memory content"
              />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!memoryContent}
              >
                Clear Memory
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
