
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type MemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memoryContent: string;
  onClearMemory: () => void;
  onUpdateMemory: (content: string) => Promise<void>;
};

// --- Components ---

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            active 
            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
    >
        {icon}
        <span>{children}</span>
    </button>
);

const MemoryItem: React.FC<{ 
    text: string, 
    onEdit: (newText: string) => void, 
    onDelete: () => void,
    searchQuery: string
}> = ({ 
    text, 
    onEdit, 
    onDelete,
    searchQuery 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(text);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim() !== text) {
            onEdit(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditValue(text);
            setIsEditing(false);
        }
    };

    // Highlight matching text
    const renderText = () => {
        if (!searchQuery) return text;
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === searchQuery.toLowerCase() 
                    ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-slate-900 dark:text-white rounded-sm px-0.5">{part}</mark>
                    : part
                )}
            </span>
        );
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-sm transition-all"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
                </svg>
            </div>
            
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input 
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent border-b border-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white px-1 py-0.5"
                    />
                ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        {renderText()}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-md transition-colors"
                    title="Edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                </button>
                <button 
                    onClick={onDelete}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
};

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, memoryContent, onClearMemory, onUpdateMemory }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'raw'>('list');
  const [rawContent, setRawContent] = useState(memoryContent);
  const [newItemText, setNewItemText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Initialize state when modal opens
  useEffect(() => {
      if (isOpen) {
          setRawContent(memoryContent);
          setHasUnsavedChanges(false);
          setNewItemText('');
          setSearchQuery('');
      }
  }, [isOpen, memoryContent]);

  // Derived list from raw content (split by newlines, filter empty)
  const memoryList = useMemo(() => {
      return rawContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }, [rawContent]);

  const filteredList = useMemo(() => {
      if (!searchQuery) return memoryList;
      return memoryList.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [memoryList, searchQuery]);

  // --- List Operations ---

  const handleAddItem = () => {
      if (!newItemText.trim()) return;
      const updatedContent = rawContent ? `${rawContent}\n${newItemText.trim()}` : newItemText.trim();
      setRawContent(updatedContent);
      setNewItemText('');
      setHasUnsavedChanges(true);
      // Scroll to bottom
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleEditItem = (index: number, newText: string) => {
      const newList = [...memoryList];
      newList[index] = newText;
      setRawContent(newList.join('\n'));
      setHasUnsavedChanges(true);
  };

  const handleDeleteItem = (index: number) => {
      const newList = [...memoryList];
      newList.splice(index, 1);
      setRawContent(newList.join('\n'));
      setHasUnsavedChanges(true);
  };

  // --- Global Operations ---

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdateMemory(rawContent);
          setHasUnsavedChanges(false);
      } catch (error) {
          alert("Failed to save memory. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRawContent(e.target.value);
      setHasUnsavedChanges(true);
  };

  const handleExport = () => {
      const blob = new Blob([rawContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `memory-export-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleClear = () => {
      if (confirm("Are you sure you want to clear all memory? This cannot be undone.")) {
          setRawContent('');
          setHasUnsavedChanges(true);
      }
  };

  // Calculate stats
  const charCount = rawContent.length;
  const tokenCount = Math.ceil(charCount / 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e1e1e] z-10">
                <div className="flex items-center justify-between px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Memory</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{charCount} chars</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>~{tokenCount} tokens</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 0 0 1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 pb-4 gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                        <TabButton 
                            active={activeTab === 'list'} 
                            onClick={() => setActiveTab('list')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 6.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>}
                        >
                            Smart List
                        </TabButton>
                        <TabButton 
                            active={activeTab === 'raw'} 
                            onClick={() => setActiveTab('raw')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13ZM4 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-13Z" clipRule="evenodd" /><path d="M10.5 6.5a.5.5 0 0 0-1 0v2h-2a.5.5 0 0 0 0 1h2v2a.5.5 0 0 0 1 0v-2h2a.5.5 0 0 0 0-1h-2v-2Z" /></svg>}
                        >
                            Raw Text
                        </TabButton>
                    </div>

                    <div className="flex-1 max-w-xs relative group">
                        <input
                            type="text"
                            placeholder="Search memory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'list' ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1a1a]">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                    placeholder="Type a new memory fact and press Enter..."
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                                />
                                <button 
                                    onClick={handleAddItem}
                                    disabled={!newItemText.trim()}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {filteredList.length > 0 ? (
                                    filteredList.map((item, index) => (
                                        <MemoryItem 
                                            key={index + item.substring(0, 10)}
                                            text={item} 
                                            onEdit={(newText) => handleEditItem(index, newText)}
                                            onDelete={() => handleDeleteItem(index)}
                                            searchQuery={searchQuery}
                                        />
                                    ))
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm"
                                    >
                                        {searchQuery ? 'No matching memories found' : 'No memories yet. Add one above!'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={listEndRef} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full relative">
                        <textarea
                            value={rawContent}
                            onChange={handleRawChange}
                            placeholder="Enter memory content here..."
                            className="w-full h-full p-6 bg-white dark:bg-[#151515] text-slate-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed custom-scrollbar"
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] flex items-center justify-between z-10">
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        title="Export Memory"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                    </button>
                    <button
                        onClick={handleClear}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Clear All Memory"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`
                            px-6 py-2 text-sm font-semibold text-white rounded-xl transition-all flex items-center gap-2
                            ${!hasUnsavedChanges || isSaving ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-md hover:shadow-lg hover:-translate-y-0.5'}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
