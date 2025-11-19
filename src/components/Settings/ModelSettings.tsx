
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Model } from '../../services/modelService';
import { ModelSelector } from '../UI/ModelSelector';
import { SettingItem } from './SettingItem';

type ModelSettingsProps = {
  models: Model[];
  imageModels: Model[];
  videoModels: Model[];
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

export const ModelSettings: React.FC<ModelSettingsProps> = ({
    models, imageModels, videoModels, selectedModel, onModelChange,
    temperature, setTemperature, maxTokens, setMaxTokens,
    imageModel, onImageModelChange, videoModel, onVideoModelChange,
    disabled
}) => {
    const noModelsAvailable = models.length === 0;
    return (
        <div className="space-y-2">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Model Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Fine-tune the AI's behavior and capabilities.</p>
            </div>
            
            {noModelsAvailable && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                <div>
                    <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">No Models Available</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                      Please configure your API key in the General tab to load available models.
                    </p>
                </div>
              </div>
            )}

            <SettingItem label="Chat Model" description="The primary model used for reasoning and conversation." layout="col">
                <ModelSelector models={models} selectedModel={selectedModel} onModelChange={onModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
            </SettingItem>

            <div className="grid md:grid-cols-2 gap-6">
                <SettingItem label="Image Model" description="Model for image generation." layout="col" className="!border-0 pb-0">
                    <ModelSelector models={imageModels} selectedModel={imageModel} onModelChange={onImageModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
                </SettingItem>
                <SettingItem label="Video Model" description="Model for video generation." layout="col" className="!border-0 pb-0">
                    <ModelSelector models={videoModels} selectedModel={videoModel} onModelChange={onVideoModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
                </SettingItem>
            </div>
            
            <div className="h-px bg-slate-200 dark:bg-white/10 my-4"></div>

            <SettingItem label="Temperature" description="Controls randomness. Higher values make output more creative, lower values more deterministic.">
                <div className="w-full max-w-[240px] flex items-center gap-4">
                     <div className="flex-1 relative h-10 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={e => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 z-10 relative"
                            disabled={disabled}
                        />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-lg overflow-hidden pointer-events-none">
                            <div className="h-full bg-indigo-500" style={{ width: `${temperature * 100}%` }}></div>
                        </div>
                     </div>
                     <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md min-w-[3rem] text-center">
                        {temperature.toFixed(1)}
                     </span>
                </div>
            </SettingItem>

            <SettingItem label="Max Output Tokens" description="Limit response length. Set to 0 for the model's default maximum.">
                <div className="relative">
                     <input
                        type="number"
                        min="0"
                        step="100"
                        value={maxTokens}
                        onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
                        className="w-32 pl-3 pr-12 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
                        disabled={disabled}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                        tok
                    </span>
                </div>
            </SettingItem>
        </div>
    );
};
