
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
import JSZip from 'jszip';
import type { MemoryFile } from '../../hooks/useMemory';

const motion = motionTyped as any;

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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-black/20">
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-layer-1">
                 <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                    Back
                </button>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{file ? 'Edit File' : 'New File'}</h3>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    Save
                </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4 overflow-hidden">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="File Title (e.g., Project Specs)"
                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-base sm:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter content..."
                    className="flex-1 w-full p-3 sm:p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
                />
            </div>
        </div>
    );
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, memoryFiles, onUpdateMemoryFiles }) => {
  const [localFiles, setLocalFiles] = useState<MemoryFile[]>(memoryFiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingFile, setEditingFile] = useState<MemoryFile | null | 'new'>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
              setIsExportMenuOpen(false);
          }
      };
      if (isExportMenuOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

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

  const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const sanitizeFilename = (name: string) => {
      return name.replace(/[^a-z0-9_\-]/gi, '_');
  };

  const handleExportJSON = () => {
      setIsExporting(true);
      setIsExportMenuOpen(false);
      
      // Use timeout to allow UI update (closing menu/showing spinner)
      setTimeout(() => {
          try {
            const exportData = { files: localFiles };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            downloadBlob(blob, `memory-export-${new Date().toISOString().slice(0, 10)}.json`);
          } catch (e) {
            console.error("JSON Export failed", e);
            alert("Failed to export JSON");
          } finally {
            setIsExporting(false);
          }
      }, 50);
  };

  const handleExportText = () => {
      if (localFiles.length === 0) return;
      
      // Close the menu immediately
      setIsExportMenuOpen(false);
      setIsExporting(true);
      
      // Yield to the event loop to allow the UI update to render
      setTimeout(async () => {
          try {
            if (localFiles.length === 1) {
                const file = localFiles[0];
                const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
                downloadBlob(blob, `${sanitizeFilename(file.title)}.txt`);
            } else {
                const zip = new JSZip();
                // Add files synchronously but efficiently
                localFiles.forEach(file => {
                    zip.file(`${sanitizeFilename(file.title)}.txt`, file.content);
                });
                // Generate async
                const content = await zip.generateAsync({ 
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: 5 } // Balance speed/size
                });
                downloadBlob(content, `memory-files-${new Date().toISOString().slice(0, 10)}.zip`);
            }
          } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export files.");
          } finally {
            setIsExporting(false);
          }
      }, 100); // Slightly longer delay to ensure spinner renders
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
            className="bg-slate-50 dark:bg-layer-1 rounded-xl sm:rounded-2xl shadow-2xl w-[95vw] sm:w-full max-w-3xl h-[90vh] sm:h-[85vh] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
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
                <div className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-layer-1 z-10">
                    <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex-1">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Manage Memory</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                View and edit the persistent files the AI has created.
                            </p>
                        </div>
                        <div>
                            <button 
                                onClick={onClose} 
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                        <>
                             {/* Toolbar: Search + New File */}
                             <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80 dark:bg-layer-2/90 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                <div className="flex-1 relative group">
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
                                    />
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                    </svg>
                                </div>
                                <button 
                                    onClick={() => setEditingFile('new')}
                                    className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    New File
                                </button>
                            </div>

                            {/* File List */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                                <AnimatePresence initial={false}>
                                    {filteredFiles.map(file => (
                                        <motion.div 
                                            key={file.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setEditingFile(file)}
                                            className="group cursor-pointer relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">
                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{file.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{file.content}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                    {new Date(file.lastUpdated).toLocaleDateString()} {new Date(file.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute top-3 right-3 sm:static">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingFile(file); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title="Edit / Rename"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleFileDelete(file.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete File"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredFiles.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-layer-1 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 z-10">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                disabled={isExporting}
                                className={`w-full sm:w-auto justify-center px-3 py-2 flex items-center gap-2 text-xs font-medium rounded-lg transition-colors border ${isExportMenuOpen ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 disabled:opacity-50'}`}
                                title="Export options"
                            >
                                {isExporting ? (
                                    <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                )}
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                            <AnimatePresence>
                                {isExportMenuOpen && !isExporting && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute bottom-full left-0 mb-2 w-full sm:w-40 bg-white dark:bg-[#2D2D2D] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-1 z-20"
                                    >
                                        <button onClick={handleExportJSON} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <span className="font-mono">.json</span> JSON File
                                        </button>
                                        <button onClick={handleExportText} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                                            <span className="font-mono">{localFiles.length > 1 ? '.zip' : '.txt'}</span> {localFiles.length > 1 ? 'Text Files (ZIP)' : 'Text File'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to clear all memory files? This cannot be undone.")) {
                                    setLocalFiles([]);
                                    setHasUnsavedChanges(true);
                                }
                            }}
                            className="flex-1 sm:flex-initial justify-center px-3 py-2 flex items-center gap-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            Clear All
                        </button>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {hasUnsavedChanges ? 'Cancel' : 'Close'}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`
                                flex-1 sm:flex-initial px-6 py-2 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md
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
