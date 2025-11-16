/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Model, validImageModels, validVideoModels } from '../../services/modelService';
import { ModelSelector } from '../UI/ModelSelector';
import { motion } from 'framer-motion';

type ModelSettingsProps = {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
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
  disabled: boolean;
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">{description}</p>
        {children}
    </div>
);

export const ModelSettings: React.FC<ModelSettingsProps> = ({
    models, selectedModel, onModelChange,
    temperature, setTemperature, maxTokens, setMaxTokens,
    imageModel, onImageModelChange, videoModel, onVideoModelChange,
    defaultTemperature, defaultMaxTokens,
    disabled
}) => {
    return (
        <div className="space-y-8" style={{ perspective: '800px' }}>
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Model & Behavior</h3>
            <SettingField label="Chat Model" description="Select the model for new chats. This can be changed for the current chat.">
                <ModelSelector models={models} selectedModel={selectedModel} onModelChange={onModelChange} disabled={disabled} className="max-w-xs" />
            </SettingField>

            <SettingField label="Image Generation Model" description="Select the model used by the `generateImage` tool.">
                <ModelSelector models={validImageModels} selectedModel={imageModel} onModelChange={onImageModelChange} disabled={disabled} className="max-w-xs" />
            </SettingField>

            <SettingField label="Video Generation Model" description="Select the model used by the `generateVideo` tool.">
                <ModelSelector models={validVideoModels} selectedModel={videoModel} onModelChange={onVideoModelChange} disabled={disabled} className="max-w-xs" />
            </SettingField>
            
            <SettingField label="Temperature" description="Controls randomness. Lower values are more deterministic, higher values are more creative.">
                <div className="flex items-center gap-3 max-w-xs">
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
                    <span className="font-mono text-sm font-semibold text-gray-800 dark:text-slate-200 w-10 text-center">{temperature.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs px-1">
                    <span>Deterministic</span>
                    <span>Creative</span>
                </div>
                <motion.button
                    onClick={() => setTemperature(defaultTemperature)}
                    disabled={disabled || temperature === defaultTemperature}
                    className="mt-3 px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 dark:bg-black/20 text-gray-800 dark:text-slate-200 border border-white/20 dark:border-white/10 shadow-md hover:bg-white/20 dark:hover:bg-black/30"
                    whileHover={{ scale: 1.05, y: -1, z: 5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Reset to default ({defaultTemperature.toFixed(1)})
                </motion.button>
            </SettingField>

            <SettingField label="Max Output Tokens" description="Set a limit on the number of tokens per model response. Leave at 0 to use the model's default.">
                 <div className="flex items-center gap-4 max-w-xs">
                    <input
                        type="number"
                        min="0"
                        step="100"
                        value={maxTokens}
                        onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        disabled={disabled}
                    />
                    <motion.button
                        onClick={() => setMaxTokens(defaultMaxTokens)}
                        disabled={disabled || maxTokens === defaultMaxTokens}
                        className="px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 dark:bg-black/20 text-gray-800 dark:text-slate-200 border border-white/20 dark:border-white/10 shadow-md hover:bg-white/20 dark:hover:bg-black/30"
                        whileHover={{ scale: 1.05, y: -1, z: 5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Reset
                    </motion.button>
                </div>
            </SettingField>
        </div>
    );
};