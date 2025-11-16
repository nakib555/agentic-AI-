/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ImportChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
};

const jsonStructureExample = `
{
  "id": "string (will be replaced)",
  "title": "string",
  "messages": [
    {
      "id": "string (will be replaced)",
      "role": "'user' or 'model'",
      "text": "string (for user messages)",
      "attachments": [ 
        {
          "name": "string",
          "mimeType": "string",
          "data": "base64 string"
        }
      ],
      "responses": [
        {
          "text": "string (for model messages)",
          "toolCallEvents": "array (optional)",
          "error": "object (optional)",
          // ...other model response fields
        }
      ],
      "activeResponseIndex": "number"
    }
  ],
  "model": "string (e.g., 'gemini-2.5-pro')",
  "createdAt": "number (timestamp, will be replaced)"
}
`;

export const ImportChatModal: React.FC<ImportChatModalProps> = ({ isOpen, onClose, onFileUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  const openFileDialog = () => {
    document.getElementById('import-file-input')?.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-chat-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-4xl h-auto max-h-[80vh] border border-gray-200 dark:border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <h2 id="import-chat-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                Import Chat
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Left Side: Upload */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 0 0 1.09 1.03L9.25 4.636v8.614Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-slate-100">Import from JSON</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                    Upload a JSON file that was previously exported from this application to restore a conversation.
                  </p>
                  <input id="import-file-input" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                  <button onClick={openFileDialog} className="mt-6 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                    Upload File
                  </button>
                </div>
              </div>

              {/* Right Side: Documentation */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">JSON Structure</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">
                  The JSON file must match the following structure. Fields marked with `(will be replaced)` will be ignored and regenerated upon import.
                </p>
                <pre className="p-3 bg-gray-100 dark:bg-black/30 rounded-lg text-xs font-mono text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                  <code>{jsonStructureExample.trim()}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
