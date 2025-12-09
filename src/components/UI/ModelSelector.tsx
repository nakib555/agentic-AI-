
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16.5 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path fillRule="evenodd" d="M1.5 14.25c0-2.146 2.925-5.813 10.5-5.813 7.575 0 10.5 3.667 10.5 5.813V20.25a2.25 2.25 0 0 1-2.25 2.25H3.75a2.25 2.25 0 0 1-2.25-2.25v-6ZM4.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm16.5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" />
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
            bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10
            rounded-2xl transition-all duration-200 ease-out
            hover:bg-white dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/20 hover:shadow-sm
            focus:outline-none focus:ring-4 focus:ring-indigo-500/10
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500 dark:border-indigo-500 bg-white dark:bg-white/10' : ''}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors duration-200 shadow-sm
                ${disabled 
                    ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-600' 
                    : 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-white/5 group-hover:scale-105'
                }
            `}>
                {icon || <DefaultModelIcon />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-sm font-bold truncate transition-colors ${selectedModelData ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedModelData ? selectedModelData.name : placeholder}
                </span>
                {selectedModelData && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate opacity-80">
                        {selectedModelData.description || selectedModelData.id}
                    </span>
                )}
            </div>
        </div>
        
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
            ${isOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-300 rotate-180' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
        `}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-[#151515]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 origin-top"
          >
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {models.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No models available</p>
                    </div>
                ) : (
                    models.map((model) => {
                        const isSelected = selectedModel === model.id;
                        return (
                            <button
                                key={model.id}
                                onClick={() => handleSelect(model.id)}
                                className={`
                                    relative w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 group
                                    ${isSelected 
                                        ? 'bg-indigo-50/80 dark:bg-indigo-500/20' 
                                        : 'hover:bg-slate-100 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className={`
                                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                                    ${isSelected 
                                        ? 'border-indigo-500 bg-indigo-500 scale-100' 
                                        : 'border-slate-300 dark:border-slate-600 scale-90 opacity-60 group-hover:border-indigo-400 group-hover:scale-100 group-hover:opacity-100'
                                    }
                                `}>
                                    {isSelected && (
                                        <motion.svg 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-3 h-3 text-white" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor" 
                                            strokeWidth={4}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </motion.svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {model.name}
                                        </span>
                                    </div>
                                    {model.description && (
                                        <p className={`text-xs mt-0.5 line-clamp-1 opacity-80 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {model.description}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-mono opacity-50 mt-0.5 truncate text-slate-400">
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
