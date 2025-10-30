/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../../services/modelService';

type ModelSelectorProps = {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onModelChange, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const selectedModelName = models.find(m => m.id === selectedModel)?.name || 'Select Model';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectorRef}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 w-full border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 backdrop-blur-md flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                <path d="M12 4C13.1046 4 14 4.89543 14 6V7.67451C15.8457 8.21661 17.2166 9.58752 17.7587 11.4332H19.4332C20.5378 11.4332 21.4332 12.3287 21.4332 13.4332C21.4332 14.5378 20.5378 15.4332 19.4332 15.4332H17.7587C17.2166 17.2789 15.8457 18.6498 14 19.1919V20.8665C14 21.9711 13.1046 22.8665 12 22.8665C10.8954 22.8665 10 21.9711 10 20.8665V19.1919C8.15432 18.6498 6.7834 17.2789 6.24131 15.4332H4.56681C3.46224 15.4332 2.56681 14.5378 2.56681 13.4332C2.56681 12.3287 3.46224 11.4332 4.56681 11.4332H6.24131C6.7834 9.58752 8.15432 8.21661 10 7.67451V6C10 4.89543 10.8954 4 12 4ZM12 9.14155C9.88142 9.14155 8.14155 10.8814 8.14155 13C8.14155 15.1186 9.88142 16.8584 12 16.8584C14.1186 16.8584 15.8584 15.1186 15.8584 13C15.8584 10.8814 14.1186 9.14155 12 9.14155Z" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{disabled ? 'Loading Models...' : selectedModelName}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-white/80 dark:bg-black/50 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-lg shadow-lg z-10 overflow-hidden"
            role="listbox"
          >
            {models.map(model => (
              <li key={model.id} className="group relative">
                <button
                  onClick={() => handleSelect(model.id)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${selectedModel === model.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/5'}`}
                  role="option"
                  aria-selected={selectedModel === model.id}
                >
                  <span>{model.name}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};