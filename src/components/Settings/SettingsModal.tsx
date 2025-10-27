/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../../services/modelService';
import { ModelSelector } from '../UI/ModelSelector';
import { ToggleSwitch } from '../UI/ToggleSwitch';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  defaultSystemPrompt: string;
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
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="space-y-3 py-6 border-b border-gray-200 dark:border-white/10 last:border-b-0">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            {label}
        </label>
        {children}
        <p className="text-sm text-gray-500 dark:text-slate-400">
            {description}
        </p>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`relative px-1 py-3 text-sm font-semibold transition-colors focus:outline-none ${
        isActive
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
      }`}
    >
      {label}
      {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            layoutId="settings-tab-underline"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
      )}
    </button>
);

const TTS_VOICES = [
    { id: 'Kore', name: 'Kore' },
    { id: 'Puck', name: 'Puck' },
    { id: 'Charon', name: 'Charon' },
    { id: 'Fenrir', name: 'Fenrir' },
    { id: 'Zephyr', name: 'Zephyr' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, models, selectedModel, onModelChange,
    systemPrompt, setSystemPrompt, temperature, setTemperature, maxTokens, setMaxTokens,
    defaultSystemPrompt, defaultTemperature, defaultMaxTokens, 
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,
    disabled 
}) => {
    const [activeTab, setActiveTab] = useState<'model' | 'interface'>('model');
    
    const handleReset = () => {
        setSystemPrompt(defaultSystemPrompt);
        setTemperature(defaultTemperature);
        setMaxTokens(defaultMaxTokens);
    };
    
    const tabContentVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
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
            
            <div className="flex-1 flex flex-col min-h-0">
                {/* Tab Navigation */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 px-6">
                    <div className="flex items-center gap-6">
                        <TabButton label="Model" isActive={activeTab === 'model'} onClick={() => setActiveTab('model')} />
                        <TabButton label="Interface" isActive={activeTab === 'interface'} onClick={() => setActiveTab('interface')} />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="space-y-6"
                        >
                            {activeTab === 'model' && (
                                <>
                                    <SettingField label="AI Model" description="Select the model for new chats. This can be changed for the current chat.">
                                        <ModelSelector models={models} selectedModel={selectedModel} onModelChange={onModelChange} disabled={disabled} className="w-full" />
                                    </SettingField>
                                    <SettingField label="System Prompt" description="Add a custom instruction to guide the AI's behavior, persona, and responses for new chats.">
                                        <textarea
                                            value={systemPrompt}
                                            onChange={e => setSystemPrompt(e.target.value)}
                                            disabled={disabled}
                                            placeholder="e.g., You are a helpful and friendly assistant that explains complex topics in simple terms."
                                            className="w-full min-h-[96px] max-h-48 p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-y-auto placeholder-gray-500 dark:placeholder-slate-400 resize-none"
                                            aria-disabled={disabled}
                                        />
                                    </SettingField>
                                    <SettingField label={`Temperature: ${temperature.toFixed(1)}`} description="Controls randomness. Lower values are more deterministic, higher values are more creative.">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={temperature}
                                            onChange={e => setTemperature(parseFloat(e.target.value))}
                                            className="w-full"
                                            disabled={disabled}
                                        />
                                    </SettingField>
                                    <SettingField label="Max Output Tokens" description="Set a limit on the number of tokens per model response. Leave at 0 to use the model's default.">
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={maxTokens}
                                            onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
                                            className="w-full p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            disabled={disabled}
                                        />
                                    </SettingField>
                                </>
                            )}

                            {activeTab === 'interface' && (
                                <>
                                    <SettingField label="Conversation Memory" description="Allow the AI to remember key details across chats for a more personalized experience.">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">Enable Memory</span>
                                            <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
                                        </div>
                                        <button 
                                            onClick={onManageMemory} 
                                            disabled={!isMemoryEnabled || disabled}
                                            className="w-full mt-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Manage Memory
                                        </button>
                                    </SettingField>
                                    <SettingField label="Text-to-Speech Voice" description="Select the voice for the 'Listen' feature on AI messages.">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                                            {TTS_VOICES.map((voice) => (
                                                <button
                                                    key={voice.id}
                                                    onClick={() => setTtsVoice(voice.id)}
                                                    disabled={disabled}
                                                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                                                        ttsVoice === voice.id
                                                            ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/50'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {voice.name}
                                                </button>
                                            ))}
                                        </div>
                                    </SettingField>
                                    <SettingField label="Auto-Play Audio" description="Automatically play the audio for new AI messages when they are complete.">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">Enable Auto-Play</span>
                                            <ToggleSwitch checked={isAutoPlayEnabled} onChange={setIsAutoPlayEnabled} disabled={disabled} />
                                        </div>
                                    </SettingField>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    disabled={disabled}
                >
                    Reset to Defaults
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    Done
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};