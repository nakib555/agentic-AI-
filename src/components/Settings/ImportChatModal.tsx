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

const jsonStructureExample = `{
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
          "error": "object (optional)"
        }
      ],
      "activeResponseIndex": "number"
    }
  ],
  "model": "string (e.g., 'gemini-2.5-pro')",
  "createdAt": "number (timestamp, will be replaced)"
}`;

// Simple function to add syntax highlighting spans to a JSON string
const getHighlightedJson = (jsonString: string) => {
  const html = jsonString
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      let cls = 'text-green-600 dark:text-green-400'; // string
      if (/:$/.test(match)) {
        cls = 'text-indigo-500 dark:text-indigo-400 font-medium'; // key
      }
      return `<span class="${cls}">${match}</span>`;
    })
    .replace(/\b(true|false|null)\b/g, '<span class="text-red-500 dark:text-red-400">$1</span>') // boolean/null
    .replace(/\b(string|number|array|object)\b/g, '<span class="text-amber-600 dark:text-amber-400 italic">$1</span>'); // types

  return { __html: html };
};


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
          className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-chat-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-slate-50 dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
              <h2 id="import-chat-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                Import Chat
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-black/20"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 flex-1 min-h-0">
              {/* Left Side: Upload Dropzone */}
              <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10">
                <div 
                  onClick={openFileDialog} 
                  className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/30 cursor-pointer transition-colors"
                >
                  <div className="text-indigo-500 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                  </div>
                  <p className="mt-4 font-semibold text-gray-800 dark:text-slate-100">Click to upload or drag and drop</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">JSON file (.json)</p>
                </div>
                <input id="import-file-input" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Right Side: Documentation */}
              <div className="p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Required JSON Structure</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">
                  Your file must match the structure below. Fields like `id` and `createdAt` will be regenerated on import.
                </p>
                <div className="rounded-lg bg-slate-100 dark:bg-black/30 overflow-hidden shadow-inner dark:shadow-black/50">
                    <div className="px-4 py-2 bg-slate-200 dark:bg-black/40 border-b border-slate-300 dark:border-white/10">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Example: chat-export.json</p>
                    </div>
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
                      <code dangerouslySetInnerHTML={getHighlightedJson(jsonStructureExample.trim())} />
                    </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
