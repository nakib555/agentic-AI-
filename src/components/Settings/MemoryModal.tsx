
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type MemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memoryContent: string;
  onClearMemory: () => void;
  onUpdateMemory: (content: string) => Promise<void>;
};

const Highlighter = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) {
        return <span className="whitespace-pre-wrap">{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 dark:bg-yellow-500/50 text-black dark:text-white rounded-sm">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, memoryContent, onClearMemory, onUpdateMemory }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [editedContent, setEditedContent] = useState(memoryContent);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      setEditedContent(memoryContent);
  }, [memoryContent, isOpen]);

  // Estimate token count (rough approx: 1 token ~= 4 chars)
  const tokenCount = Math.ceil(editedContent.length / 4);
  const charCount = editedContent.length;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
        await onUpdateMemory(editedContent);
        setActiveTab('view');
    } catch (error) {
        setSaveError("Failed to save changes. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleExport = () => {
      const blob = new Blob([editedContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-memory-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(editedContent);
      // Could show a toast here, but simple button feedback is often enough
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the AI\'s memory? This cannot be undone and will remove all personalized context.')) {
      onClearMemory();
      setEditedContent('');
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
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 backdrop-blur-md z-10">
                <div className="flex items-center justify-between px-6 py-4">
                    <div>
                        <h2 id="memory-title" className="text-xl font-bold text-gray-800 dark:text-slate-100">
                            Manage Memory
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Core Knowledge & Personalization Context
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors"
                        aria-label="Close memory settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </div>
                
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 gap-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5">
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'view' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                        >
                            View
                        </button>
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                        >
                            Edit
                        </button>
                    </div>
                    
                    {activeTab === 'view' && (
                        <div className="relative flex-1 max-w-xs">
                            <input
                                type="text"
                                placeholder="Search memory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-lg text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-500/10 flex items-center gap-4 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <span>{charCount.toLocaleString()} characters</span>
                <span className="w-1 h-1 bg-indigo-300 dark:bg-indigo-700 rounded-full"></span>
                <span>~{tokenCount.toLocaleString()} tokens</span>
                {saveError && <span className="ml-auto text-red-500">{saveError}</span>}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-50/30 dark:bg-black/20">
                {activeTab === 'view' ? (
                    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                         {editedContent ? (
                            <div className="prose dark:prose-invert max-w-none text-sm font-mono leading-relaxed">
                                <Highlighter text={editedContent} highlight={searchQuery} />
                            </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                 </svg>
                                 <p>Memory is empty.</p>
                             </div>
                         )}
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-full p-6 bg-transparent border-none resize-none focus:ring-0 text-sm font-mono text-gray-800 dark:text-slate-200 leading-relaxed custom-scrollbar"
                        placeholder="Enter memory content here..."
                        spellCheck={false}
                    />
                )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] z-10">
                <div className="flex gap-2">
                     <button
                        onClick={handleClear}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={!editedContent || isSaving}
                        title="Delete all memory"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                        Clear
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy to clipboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.879a1.5 1.5 0 0 1 1.06.44l3.122 3.121A1.5 1.5 0 0 1 19 6.621V16.5A1.5 1.5 0 0 1 17.5 18h-9A1.5 1.5 0 0 1 7 16.5v-13Z" /><path d="M5 2.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H5Z" /></svg>
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        title="Export as .txt"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {activeTab === 'edit' ? (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSaving && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            Save Changes
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
