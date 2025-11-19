
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MemoryFile } from '../../hooks/useMemory';

type MemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memoryFiles: MemoryFile[];
  onUpdateMemoryFiles: (files: MemoryFile[]) => Promise<void>;
};

// --- Sub-Components ---

const FileEditor: React.FC<{
    file: MemoryFile | null;
    onSave: (file: MemoryFile) => void;
    onCancel: () => void;
}> = ({ file, onSave, onCancel }) => {
    const [title, setTitle] = useState(file?.title || '');
    const [content, setContent] = useState(file?.content || '');

    const handleSave = () => {
        if (!title.trim()) return alert('Title is required');
        onSave({
            id: file?.id || crypto.randomUUID(),
            title,
            content,
            lastUpdated: Date.now()
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#151515]">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1e1e1e]">
                 <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" /></svg>
                    Back
                </button>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{file ? 'Edit File' : 'New File'}</h3>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    Save
                </button>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="File Title (e.g., Project Specs)"
                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter content..."
                    className="flex-1 w-full p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
                />
            </div>
        </div>
    );
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, memoryFiles, onUpdateMemoryFiles }) => {
  const [localFiles, setLocalFiles] = useState<MemoryFile[]>(memoryFiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingFile, setEditingFile] = useState<MemoryFile | null | 'new'>(null);
  
  // Initialize state when modal opens
  useEffect(() => {
      if (isOpen) {
          setLocalFiles(memoryFiles);
          setHasUnsavedChanges(false);
          setSearchQuery('');
          setEditingFile(null);
      }
  }, [isOpen, memoryFiles]);

  const filteredFiles = useMemo(() => {
      if (!searchQuery) return localFiles;
      return localFiles.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [localFiles, searchQuery]);

  // --- Operations ---

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdateMemoryFiles(localFiles);
          setHasUnsavedChanges(false);
      } catch (error) {
          alert("Failed to save memory files. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleFileSave = (file: MemoryFile) => {
      setLocalFiles(prev => {
          const exists = prev.find(f => f.id === file.id);
          if (exists) {
              return prev.map(f => f.id === file.id ? file : f);
          }
          return [...prev, file];
      });
      setHasUnsavedChanges(true);
      setEditingFile(null);
  };

  const handleFileDelete = (id: string) => {
      if (confirm("Delete this file?")) {
          setLocalFiles(prev => prev.filter(f => f.id !== id));
          setHasUnsavedChanges(true);
      }
  };

  const handleExport = () => {
      const exportData = { files: localFiles };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `memory-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {editingFile ? (
                <FileEditor 
                    file={editingFile === 'new' ? null : editingFile} 
                    onSave={handleFileSave} 
                    onCancel={() => setEditingFile(null)} 
                />
            ) : (
            <>
                {/* Header */}
                <div className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e1e1e] z-10">
                    <div className="flex items-center justify-between px-6 py-5">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Memory Files</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                View and edit the persistent files the AI has created.
                            </p>
                        </div>
                        <div>
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                        <>
                             {/* Toolbar: Search + New File */}
                             <div className="px-6 py-4 bg-slate-50/80 dark:bg-[#1a1a1a]/90 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 z-10 flex items-center gap-4">
                                <div className="flex-1 relative group">
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
                                    />
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <button 
                                    onClick={() => setEditingFile('new')}
                                    className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                                    New File
                                </button>
                            </div>

                            {/* File List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                                <AnimatePresence initial={false}>
                                    {filteredFiles.map(file => (
                                        <motion.div 
                                            key={file.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setEditingFile(file)}
                                            className="group cursor-pointer relative flex items-start gap-4 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">
                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{file.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{file.content}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h2.25a.75.75 0 0 0 0-1.5h-1.5V5Z" clipRule="evenodd" /></svg>
                                                    {new Date(file.lastUpdated).toLocaleDateString()} {new Date(file.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingFile(file); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title="Edit / Rename"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleFileDelete(file.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete File"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredFiles.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-slate-400"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" /></svg>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium">No files found.</p>
                                            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Create a new file to get started.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] flex items-center justify-between z-10">
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
                            title="Export to file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                            Export
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to clear all memory files? This cannot be undone.")) {
                                    setLocalFiles([]);
                                    setHasUnsavedChanges(true);
                                }
                            }}
                            className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                            Clear All
                        </button>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            {hasUnsavedChanges ? 'Cancel' : 'Close'}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`
                                px-6 py-2 text-sm font-semibold text-white rounded-xl transition-all flex items-center gap-2 shadow-md
                                ${!hasUnsavedChanges || isSaving 
                                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none text-slate-500 dark:text-slate-400' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : (
                                hasUnsavedChanges ? 'Save Changes' : 'Saved'
                            )}
                        </button>
                    </div>
                </div>
            </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
