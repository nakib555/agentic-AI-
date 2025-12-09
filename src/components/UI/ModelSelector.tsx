
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
import type { Model } from '../../types';

const motion = motionTyped as any;

type ModelSelectorProps = {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
};

// Default icons if none provided
const DefaultModelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled,
  className = '',
  placeholder = "Select Model",
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const selectedModelData = models.find(m => m.id === selectedModel);

  // Close on click outside
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
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
            group w-full flex items-center justify-between gap-3 px-4 py-3 text-left
            bg-slate-100/50 dark:bg-white/5 border border-transparent
            rounded-xl transition-all duration-200 ease-out
            hover:bg-slate-100 dark:hover:bg-white/10
            focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isOpen ? 'bg-white dark:bg-white/10 shadow-lg ring-1 ring-black/5 dark:ring-white/10' : ''}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`
                flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors duration-200
                ${disabled 
                    ? 'text-slate-400 dark:text-slate-600' 
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                }
            `}>
                {icon || <DefaultModelIcon />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-sm font-semibold truncate ${selectedModelData ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedModelData ? selectedModelData.name : placeholder}
                </span>
                {selectedModelData && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {selectedModelData.id}
                    </span>
                )}
            </div>
        </div>
        
        <div className={`
            text-slate-400 transition-transform duration-300
            ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'}
        `}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m6 9 6 6 6-6"/>
            </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 origin-top"
          >
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                {models.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No models available</p>
                    </div>
                ) : (
                    models.map((model) => {
                        const isSelected = selectedModel === model.id;
                        return (
                            <button
                                key={model.id}
                                onClick={() => handleSelect(model.id)}
                                className={`
                                    relative w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200 group
                                    ${isSelected 
                                        ? 'bg-indigo-50 dark:bg-indigo-500/20' 
                                        : 'hover:bg-slate-100 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {model.name}
                                        </span>
                                        {isSelected && (
                                            <div className="text-indigo-600 dark:text-indigo-400">
                                                <CheckIcon />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-indigo-700/70 dark:text-indigo-300/70' : 'text-slate-400'}`}>
                                        {model.id}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
