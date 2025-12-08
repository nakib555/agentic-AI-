/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, Suspense } from 'react';
import { AnimatePresence, motion as motionTyped, LayoutGroup } from 'framer-motion';
import type { Model } from '../../types';
import { SettingsCategoryButton } from './SettingsCategoryButton';
import type { Theme } from '../../hooks/useTheme';

const motion = motionTyped as any;

// Lazy load settings tabs to optimize memory and initial load
const GeneralSettings = React.lazy(() => import('./GeneralSettings').then(m => ({ default: m.GeneralSettings })));
const ModelSettings = React.lazy(() => import('./ModelSettings').then(m => ({ default: m.ModelSettings })));
const CustomInstructionsSettings = React.lazy(() => import('./CustomInstructionsSettings').then(m => ({ default: m.CustomInstructionsSettings })));
const SpeechMemorySettings = React.lazy(() => import('./SpeechMemorySettings').then(m => ({ default: m.SpeechMemorySettings })));

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  imageModels: Model[];
  videoModels: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onClearAllChats: () => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  onShowDataStructure: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
  aboutUser: string;
  setAboutUser: (prompt: string) => void;
  aboutResponse: string;
  setAboutResponse: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  imageModel: string;
  onImageModelChange: (modelId: string) => void;
  videoModel: string;
  onVideoModelChange: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  disabled: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const CATEGORIES = [
  { 
    id: 'general', 
    label: 'General', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ) 
  },
  { 
    id: 'model', 
    label: 'Model & Behavior', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2l9 4.5v9L12 20l-9-4.5v-9L12 2z" />
        <circle cx="12" cy="11" r="3" />
        <path d="M12 14v3" />
        <path d="M9.5 12.5l-2.5 1.5" />
        <path d="M14.5 12.5l2.5 1.5" />
      </svg>
    ) 
  },
  { 
    id: 'instructions', 
    label: 'Custom Instructions', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        <path d="M15 5l3 3" />
      </svg>
    ) 
  },
  { 
    id: 'speech', 
    label: 'Speech & Memory', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 10v4" />
        <path d="M7 6v12" />
        <path d="M11 3v18" />
        <path d="M15 8v8" />
        <path d="M19 11v2" />
      </svg>
    ) 
  },
];

const TabLoadingSkeleton = () => (
    <div className="w-full h-full p-4 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-lg w-1/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-1/2"></div>
        <div className="space-y-4 pt-4">
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5"></div>
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5"></div>
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5"></div>
        </div>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { isOpen, onClose } = props;
    const [activeCategory, setActiveCategory] = useState('general');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
            className="bg-white dark:bg-[#1e1e1e] w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:border border-slate-200 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm z-10 shrink-0">
              <h2 id="settings-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/50 dark:bg-black/20">
                {/* Navigation Sidebar */}
                <nav className="flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 md:w-64 bg-white dark:bg-[#1e1e1e] z-10">
                    <LayoutGroup id="settings-nav">
                        <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible p-2 md:p-4 hide-scrollbar">
                            {CATEGORIES.map(cat => (
                                <li key={cat.id} className="flex-shrink-0">
                                    <SettingsCategoryButton
                                        icon={cat.icon}
                                        label={cat.label}
                                        isActive={activeCategory === cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </LayoutGroup>
                </nav>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-20 md:pb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Suspense fallback={<TabLoadingSkeleton />}>
                                    {activeCategory === 'general' && <GeneralSettings onClearAllChats={props.onClearAllChats} onRunTests={props.onRunTests} onDownloadLogs={props.onDownloadLogs} onShowDataStructure={props.onShowDataStructure} apiKey={props.apiKey} onSaveApiKey={props.onSaveApiKey} theme={props.theme} setTheme={props.setTheme} />}
                                    {activeCategory === 'model' && <ModelSettings {...props} />}
                                    {activeCategory === 'instructions' && <CustomInstructionsSettings {...props} />}
                                    {activeCategory === 'speech' && <SpeechMemorySettings {...props} />}
                                </Suspense>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
