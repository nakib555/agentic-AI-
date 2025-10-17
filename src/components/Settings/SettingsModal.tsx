/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../../services/modelService';
import { ModelSelector } from '../UI/ModelSelector';

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
  disabled: boolean;
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-white/10 first:pt-0 first:border-t-0">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            {label}
        </label>
        {children}
        <p className="text-sm text-gray-500 dark:text-slate-400">
            {description}
        </p>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, models, selectedModel, onModelChange,
    systemPrompt, setSystemPrompt, temperature, setTemperature, maxTokens, setMaxTokens,
    defaultSystemPrompt, defaultTemperature, defaultMaxTokens, disabled 
}) => {
    
    const systemPromptRef = useRef<HTMLDivElement>(null);

    // Effect to synchronize the contentEditable div's content with the React state.
    // This is necessary because contentEditable is an uncontrolled component.
    useEffect(() => {
        if (systemPromptRef.current && systemPromptRef.current.innerText !== systemPrompt) {
            systemPromptRef.current.innerText = systemPrompt;
        }
    }, [systemPrompt]);

    const handleReset = () => {
        // Note: Model is not reset as it's a primary choice.
        setSystemPrompt(defaultSystemPrompt);
        setTemperature(defaultTemperature);
        setMaxTokens(defaultMaxTokens);
    };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-white/10 flex flex-col"
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

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <SettingField label="AI Model" description="Select the model for new chats. This can be changed for the current chat.">
                <ModelSelector
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  disabled={disabled}
                />
              </SettingField>

              <SettingField label="System Prompt" description="Add a custom instruction to guide the AI's behavior, persona, and responses for new chats.">
                <div className="relative">
                    <div
                        ref={systemPromptRef}
                        contentEditable={!disabled}
                        onInput={e => setSystemPrompt(e.currentTarget.innerText)}
                        className="w-full h-24 p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 modern-scrollbar overflow-y-auto"
                        aria-disabled={disabled}
                        role="textbox"
                    />
                    {!systemPrompt.trim() && (
                        <span className="absolute top-2 left-2 text-sm text-gray-500 dark:text-slate-400 pointer-events-none">
                            e.g., You are a helpful and friendly assistant that explains complex topics in simple terms.
                        </span>
                    )}
                </div>
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
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    disabled={disabled}
                >
                    Reset to Defaults
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
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