/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../../types';
import { SettingsCategoryButton } from './SettingsCategoryButton';
import { GeneralSettings } from './GeneralSettings';
import { ModelSettings } from './ModelSettings';
import { CustomInstructionsSettings } from './CustomInstructionsSettings';
import { SpeechMemorySettings } from './SpeechMemorySettings';

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
  // API Key
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
  // Custom Instructions
  aboutUser: string;
  setAboutUser: (prompt: string) => void;
  aboutResponse: string;
  setAboutResponse: (prompt: string) => void;
  // Model Settings
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
  // Speech & Memory
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  disabled: boolean;
};

const CATEGORIES = [
  { id: 'general', label: 'General', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.83 4.25A2.75 2.75 0 0 1 10.58 7v.06c.21-.03.42-.06.64-.06 1.12 0 2.16.3 3.08 1.03l-4.08 4.08a2.5 2.5 0 0 1-3.54 0L4.5 9.99A5.48 5.48 0 0 1 7.83 4.25ZM9 9.06a1 1 0 0 0-1.41 0L5.47 11.18a3.98 3.98 0 0 0 4.54 4.54l2.12-2.12a1 1 0 0 0 0-1.41L9 9.06Z" clipRule="evenodd" /></svg> },
  { id: 'model', label: 'Model & Behavior', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a5.523 5.523 0 0 0-1.503 1.334c-.792.792-1.247 1.87-1.247 2.985v.253a.75.75 0 0 0 1.5 0v-.253c0-.8-.316-1.55-.879-2.113a4.023 4.023 0 0 1 2.113-.879H7.75V2.75Z" /><path d="M12.25 2.75a.75.75 0 0 1 1.5 0v1.258a5.523 5.523 0 0 1 1.503 1.334c.792.792 1.247 1.87 1.247 2.985v.253a.75.75 0 0 1-1.5 0v-.253c0-.8-.316-1.55-.879-2.113a4.023 4.023 0 0 0-2.113-.879H12.25V2.75Z" /><path fillRule="evenodd" d="M17 10c0-2.036-1.289-3.796-3.085-4.482A5.526 5.526 0 0 0 10 3.5a5.526 5.526 0 0 0-3.915 1.018C4.289 6.204 3 7.964 3 10c0 2.036 1.289 3.796 3.085 4.482A5.526 5.526 0 0 0 10 16.5a5.526 5.526 0 0 0 3.915-1.018C15.711 13.796 17 12.036 17 10ZM10 5a4.026 4.026 0 0 1 2.848.742A4.49 4.49 0 0 1 15.5 10a4.49 4.49 0 0 1-2.652 4.258A4.026 4.026 0 0 1 10 15a4.026 4.026 0 0 1-2.848-.742A4.49 4.49 0 0 1 4.5 10a4.49 4.49 0 0 1 2.652-4.258A4.026 4.026 0 0 1 10 5Z" clipRule="evenodd" /><path d="M7.75 12.25a.75.75 0 0 0-1.5 0v.253c0 1.114.455 2.193 1.247 2.985a5.523 5.523 0 0 0 1.503 1.334V18a.75.75 0 0 0 1.5 0v-1.178a4.023 4.023 0 0 1-2.113-.879.75.75 0 0 1-.879-2.113V12.25Z" /><path d="M12.25 12.25a.75.75 0 0 1 1.5 0v.253c0 1.114-.455 2.193-1.247 2.985a5.523 5.523 0 0 1-1.503 1.334V18a.75.75 0 0 1-1.5 0v-1.178a4.023 4.023 0 0 0 2.113-.879c.563-.564.879-1.314.879-2.113V12.25Z" /></svg> },
  { id: 'instructions', label: 'Custom Instructions', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v9.5A2.25 2.25 0 0 1 15.75 17h-11.5A2.25 2.25 0 0 1 2 14.75v-9.5A2.25 2.25 0 0 1 4.25 3h11.528a2.25 2.25 0 0 1-.04.012ZM13 6.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 6.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 8.25a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5H6Z" clipRule="evenodd" /></svg> },
  { id: 'speech', label: 'Speech & Memory', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a1 1 0 0 1 2 0v1.906a2.5 2.5 0 0 1 2.375 2.45v.144a2.5 2.5 0 1 1-2.5 2.5V8.5h-1V12a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Z" /><path d="M12.5 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg> },
];

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
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#202123] w-full h-full shadow-xl md:rounded-2xl md:max-w-4xl md:h-[90vh] border border-gray-200 dark:border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <h2 id="settings-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20"
                aria-label="Close settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Navigation: top on mobile, left on desktop */}
                <nav className="flex-shrink-0 p-2 md:p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10 md:w-56">
                    {/* Horizontal list on mobile, vertical on desktop */}
                    <ul className="flex flex-row md:flex-col gap-1 md:gap-0 md:space-y-1 overflow-x-auto md:overflow-x-hidden pb-2 md:pb-0">
                        {CATEGORIES.map(cat => (
                            <li key={cat.id} className="flex-shrink-0 md:w-full">
                                <SettingsCategoryButton
                                    icon={cat.icon}
                                    label={cat.label}
                                    isActive={activeCategory === cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                />
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeCategory === 'general' && <GeneralSettings onClearAllChats={props.onClearAllChats} onRunTests={props.onRunTests} onDownloadLogs={props.onDownloadLogs} apiKey={props.apiKey} onSaveApiKey={props.onSaveApiKey} />}
                            {activeCategory === 'model' && <ModelSettings {...props} />}
                            {activeCategory === 'instructions' && <CustomInstructionsSettings {...props} />}
                            {activeCategory === 'speech' && <SpeechMemorySettings {...props} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
