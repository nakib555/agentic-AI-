/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Model } from '../../services/modelService';
import { ModelSelector } from '../UI/ModelSelector';

type ModelSettingsProps = {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
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
    disabled
}) => {
    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Model & Behavior</h3>
            <SettingField label="AI Model" description="Select the model for new chats. This can be changed for the current chat.">
                <ModelSelector models={models} selectedModel={selectedModel} onModelChange={onModelChange} disabled={disabled} className="max-w-xs" />
            </SettingField>
            
            <SettingField label={`Temperature: ${temperature.toFixed(1)}`} description="Controls randomness. Lower values are more deterministic, higher values are more creative.">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full max-w-xs"
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
                    className="w-full max-w-xs p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={disabled}
                />
            </SettingField>
        </div>
    );
};