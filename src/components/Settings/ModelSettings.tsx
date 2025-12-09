
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Model } from '../../types';
import { ModelSelector } from '../UI/ModelSelector';

// Icons
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM1.5 20.25a.75.75 0 0 1 .75.75V16.5a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1-1.5 0ZM6 20.25a.75.75 0 0 1 .75.75v-1.5a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0ZM19.5 20.25a.75.75 0 0 1 .75.75v-4.5a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0Z" clipRule="evenodd" /></svg>;
const PhotoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" /></svg>;
const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 2.485.735 4.816 2.035 6.775.341 1.23 1.518 1.895 2.66 1.895h1.933l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 1 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" /><path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" /></svg>;

// Temperature Meter Component
const TemperatureControl = ({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    const getLabel = (v: number) => {
        if (v < 0.3) return { text: "Precise", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" };
        if (v < 0.7) return { text: "Balanced", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" };
        return { text: "Creative", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" };
    };
    const label = getLabel(value);

    return (
        <div className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Response Creativity</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Controls the randomness of the output</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold border border-transparent ${label.color} ${label.bg}`}>
                    {value.toFixed(1)}
                </div>
            </div>
            
            <div className="relative h-8 flex items-center group">
                {/* Track */}
                <div className="absolute inset-x-0 h-2 bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 transition-all duration-300" 
                        style={{ width: `${value * 100}%` }} 
                    />
                </div>
                
                {/* Thumb Input */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {/* Visual Thumb */}
                <div 
                    className="absolute h-6 w-6 bg-white shadow-lg border border-slate-200 rounded-full pointer-events-none transition-all duration-150 group-hover:scale-110"
                    style={{ left: `calc(${value * 100}% - 12px)` }}
                >
                    <div className={`absolute inset-1 rounded-full opacity-80 ${value > 0.7 ? 'bg-purple-500' : value > 0.3 ? 'bg-indigo-500' : 'bg-blue-500'}`} />
                </div>
            </div>
            
            <div className="flex justify-between mt-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
            </div>
        </div>
    );
};

type ModelSettingsProps = {
  models: Model[];
  imageModels: Model[];
  videoModels: Model[];
  ttsModels: Model[];
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
  ttsModel: string;
  onTtsModelChange: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  disabled: boolean;
};

const ModelSettings: React.FC<ModelSettingsProps> = ({
    models, imageModels, videoModels, ttsModels, selectedModel, onModelChange,
    temperature, setTemperature, maxTokens, setMaxTokens,
    imageModel, onImageModelChange, videoModel, onVideoModelChange, ttsModel, onTtsModelChange,
    disabled
}) => {
    const noModelsAvailable = models.length === 0;

    return (
        <div className="space-y-8 pb-8">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Model & Behavior</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure the cognitive engine and multimodal capabilities.</p>
            </div>
            
            {noModelsAvailable && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                <div>
                    <p className="font-bold text-sm text-amber-800 dark:text-amber-200">Models Unavailable</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                      Please configure your API key in the General tab to load available models.
                    </p>
                </div>
              </div>
            )}

            {/* Core Intelligence Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Core Intelligence</h4>
                </div>
                
                <div className="grid gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Primary Reasoning Model</label>
                        <ModelSelector 
                            models={models} 
                            selectedModel={selectedModel} 
                            onModelChange={onModelChange} 
                            disabled={disabled || noModelsAvailable} 
                            placeholder="Select a reasoning model"
                            icon={<SparklesIcon />}
                        />
                    </div>

                    <TemperatureControl 
                        value={temperature} 
                        onChange={setTemperature} 
                        disabled={disabled} 
                    />
                </div>
            </section>

            <div className="h-px bg-slate-200/50 dark:bg-white/5 w-full" />

            {/* Multimodal Capabilities Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                        <PhotoIcon />
                        <VideoIcon />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Multimodal Capabilities</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Image Generation</label>
                        <ModelSelector 
                            models={imageModels} 
                            selectedModel={imageModel} 
                            onModelChange={onImageModelChange} 
                            disabled={disabled || noModelsAvailable} 
                            placeholder="Select image model"
                            icon={<PhotoIcon />}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Video Generation</label>
                        <ModelSelector 
                            models={videoModels} 
                            selectedModel={videoModel} 
                            onModelChange={onVideoModelChange} 
                            disabled={disabled || noModelsAvailable} 
                            placeholder="Select video model"
                            icon={<VideoIcon />}
                        />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Speech Synthesis (TTS)</label>
                        <ModelSelector 
                            models={ttsModels} 
                            selectedModel={ttsModel} 
                            onModelChange={onTtsModelChange} 
                            disabled={disabled || noModelsAvailable} 
                            placeholder="Select TTS model"
                            icon={<SpeakerIcon />}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(ModelSettings);
