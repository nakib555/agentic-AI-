
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, Suspense } from 'react';
import { AnimatePresence, motion as motionTyped, LayoutGroup } from 'framer-motion';
import type { Model } from '../../types';
import { SettingsCategoryButton } from './SettingsCategoryButton';
import type { Theme } from '../../hooks/useTheme';
import { SettingsSkeleton } from './SettingsSkeleton';

const motion = motionTyped as any;

// Lazy load the settings tabs to optimize bundle size and startup time
const GeneralSettings = React.lazy(() => import('./GeneralSettings'));
const ModelSettings = React.lazy(() => import('./ModelSettings'));
const CustomInstructionsSettings = React.lazy(() => import('./CustomInstructionsSettings'));
const SpeechMemorySettings = React.lazy(() => import('./SpeechMemorySettings'));

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  imageModels: Model[];
  videoModels: Model[];
  ttsModels: Model[];
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
  ttsModel: string;
  onTtsModelChange: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
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
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ) 
  },
  { 
    id: 'model', 
    label: 'Model & AI', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ) 
  },
  { 
    id: 'instructions', 
    label: 'Instructions', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ) 
  },
  { 
    id: 'speech', 
    label: 'Voice & Memory', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    ) 
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = React.memo((props) => {
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
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
            className="bg-page w-full shadow-2xl rounded-3xl max-w-5xl h-[85vh] max-h-[800px] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-20">
              <div>
                <h2 id="settings-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Preferences & Configuration</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                aria-label="Close settings"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/30 dark:bg-black/20">
                {/* Navigation Sidebar */}
                <nav className="flex-shrink-0 p-4 md:p-6 md:pr-0 md:w-64 bg-white/50 dark:bg-layer-1/50 z-10 md:border-r border-slate-200 dark:border-white/5">
                    <LayoutGroup id="settings-nav">
                        <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar">
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

                {/* Content Area - Lazy Loaded */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white dark:bg-[#0f0f0f]">
                    <div className="p-6 md:p-10 max-w-3xl mx-auto">
                        <Suspense fallback={<SettingsSkeleton />}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                >
                                    {activeCategory === 'general' && <GeneralSettings onClearAllChats={props.onClearAllChats} onRunTests={props.onRunTests} onDownloadLogs={props.onDownloadLogs} onShowDataStructure={props.onShowDataStructure} apiKey={props.apiKey} onSaveApiKey={props.onSaveApiKey} theme={props.theme} setTheme={props.setTheme} />}
                                    {activeCategory === 'model' && (
                                        <ModelSettings
                                            models={props.models}
                                            imageModels={props.imageModels}
                                            videoModels={props.videoModels}
                                            ttsModels={props.ttsModels}
                                            selectedModel={props.selectedModel}
                                            onModelChange={props.onModelChange}
                                            temperature={props.temperature}
                                            setTemperature={props.setTemperature}
                                            maxTokens={props.maxTokens}
                                            setMaxTokens={props.setMaxTokens}
                                            imageModel={props.imageModel}
                                            onImageModelChange={props.onImageModelChange}
                                            videoModel={props.videoModel}
                                            onVideoModelChange={props.onVideoModelChange}
                                            ttsModel={props.ttsModel}
                                            onTtsModelChange={props.onTtsModelChange}
                                            defaultTemperature={props.defaultTemperature}
                                            defaultMaxTokens={props.defaultMaxTokens}
                                            disabled={props.disabled}
                                        />
                                    )}
                                    {activeCategory === 'instructions' && <CustomInstructionsSettings {...props} />}
                                    {activeCategory === 'speech' && (
                                        <SpeechMemorySettings 
                                            isMemoryEnabled={props.isMemoryEnabled} 
                                            setIsMemoryEnabled={props.setIsMemoryEnabled} 
                                            onManageMemory={props.onManageMemory} 
                                            disabled={props.disabled}
                                            ttsVoice={props.ttsVoice}
                                            setTtsVoice={props.setTtsVoice}
                                            ttsModels={props.ttsModels}
                                            ttsModel={props.ttsModel}
                                            onTtsModelChange={props.onTtsModelChange}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </Suspense>
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
