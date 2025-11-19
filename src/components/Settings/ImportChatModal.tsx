
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      onFileUpload(file);
      onClose();
    } else {
      alert('Please upload a valid .json file.');
    }
  };

  const openFileDialog = () => {
    document.getElementById('import-file-input')?.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStructureExample.trim()).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-chat-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#1e1e1e]">
              <div>
                <h2 id="import-chat-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  Import Chat
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Restore a conversation from a backup file.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 flex-1 min-h-0">
              {/* Left Side: Upload Dropzone */}
              <div className="p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
                <motion.div 
                  onClick={openFileDialog}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  animate={isDragging ? { scale: 1.02, borderColor: 'var(--primary-main)', backgroundColor: 'rgba(var(--primary-main), 0.05)' } : { scale: 1, borderColor: 'transparent', backgroundColor: 'transparent' }}
                  className={`group w-full h-full flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
                    ${isDragging 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-black/20 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-lg'
                    }`}
                >
                  <motion.div 
                    className={`p-5 rounded-full mb-5 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20'}`}
                    animate={isDragging ? { y: -5 } : { y: 0 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                  </motion.div>
                  <p className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-1 text-center">
                    {isDragging ? "Drop JSON file here" : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-[200px]">
                    Upload your exported chat history file (.json)
                  </p>
                </motion.div>
                <input id="import-file-input" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Right Side: Documentation */}
              <div className="flex flex-col p-6 bg-slate-50 dark:bg-[#1a1a1a] overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wide">Required JSON Structure</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl bg-slate-200/50 dark:bg-black/30 border border-slate-300/50 dark:border-white/5 shadow-inner flex flex-col">
                    <div className="px-4 py-2.5 bg-slate-200 dark:bg-white/5 border-b border-slate-300/50 dark:border-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 font-mono flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" /></svg>
                        chat-export.json
                      </p>
                      <button
                        onClick={handleCopy}
                        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10 hover:shadow-sm transition-all border border-transparent hover:border-slate-300 dark:hover:border-white/10"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {isCopied ? (
                              <motion.span key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                  Copied
                              </motion.span>
                          ) : (
                              <motion.span key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:text-indigo-500 transition-colors"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.879a1.5 1.5 0 0 1 1.06.44l3.122 3.121A1.5 1.5 0 0 1 19 6.621V16.5A1.5 1.5 0 0 1 17.5 18h-9A1.5 1.5 0 0 1 7 16.5v-13Z" /><path d="M5 2.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H5Z" /><path d="M3 4.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H3Z" /></svg>
                                  Copy Template
                              </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    <pre className="p-4 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed text-slate-600 dark:text-slate-400">
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
