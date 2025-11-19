
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
    defaultTemperature, defaultMaxTokens,
    disabled
}) => {
    const noModelsAvailable = models.length === 0;
    return (
        <div className="space-y-1">
            <h3 className="text-xl font-bold text-content-primary mb-4 px-1">Model & Behavior</h3>
            
            {noModelsAvailable && (
              <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-text/20 rounded-lg">
                <p className="text-sm text-status-warning-text">
                  Please configure your API key in General settings to load models.
                </p>
              </div>
            )}

            <SettingItem label="Chat Model" layout="col">
                <ModelSelector models={models} selectedModel={selectedModel} onModelChange={onModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
            </SettingItem>

            <SettingItem label="Image Model" layout="col">
                <ModelSelector models={imageModels} selectedModel={imageModel} onModelChange={onImageModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
            </SettingItem>

            <SettingItem label="Video Model" layout="col">
                <ModelSelector models={videoModels} selectedModel={videoModel} onModelChange={onVideoModelChange} disabled={disabled || noModelsAvailable} className="w-full" />
            </SettingItem>
            
            <SettingItem label="Temperature" description={`Value: ${temperature.toFixed(1)}`}>
                <div className="w-32 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-1 bg-layer-3 rounded-lg appearance-none cursor-pointer accent-primary-main"
                        disabled={disabled}
                    />
                </div>
            </SettingItem>

            <SettingItem label="Max Tokens" description="0 = Model Default">
                 <input
                    type="number"
                    min="0"
                    step="100"
                    value={maxTokens}
                    onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
                    className="w-24 p-1.5 bg-layer-2 border border-border rounded-md text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-main text-content-primary"
                    disabled={disabled}
                />
            </SettingItem>
        </div>
    );
};
