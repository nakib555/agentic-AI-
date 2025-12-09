
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Model } from '../../types';
import { ModelSelector } from '../UI/ModelSelector';

// Icons
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM1.5 20.25a.75.75 0 0 1 .75.75V16.5a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1-1.5 0ZM6 20.25a.75.75 0 0 1 .75.75v-1.5a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0Z" clipRule="evenodd" /></svg>;
const PhotoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" /></svg>;
const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 2.485.735 4.816 2.035 6.775.341 1.23 1.518 1.895 2.66 1.895h1.933l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 1 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" /><path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" /></svg>;

// Modern Temperature Control with animated visual feedback
const TemperatureControl = ({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    const getLabel = (v: number) => {
        if (v < 0.3) return { text: "Precise", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", desc: "Factual & Deterministic" };
        if (v < 0.7) return { text: "Balanced", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", desc: "Natural & Engaging" };
        return { text: "Creative", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", desc: "Imaginative & Diverse" };
    };
    const label = getLabel(value);

    return (
        <div className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Response Creativity
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider ${label.color} ${label.bg}`}>
                            {label.text}
                        </span>
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{label.desc}</p>
                </div>
                <div className="font-mono text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                    {value.toFixed(1)}
                </div>
            </div>
            
            <div className="relative h-10 flex items-center group touch-none">
                {/* Track Background */}
                <div className="absolute inset-x-0 h-3 bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden shadow-inner">
                    {/* Gradient Fill */}
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 transition-all duration-100 ease-out origin-left" 
                        style={{ width: `${value * 100}%` }} 
                    />
                </div>
                
                {/* Interaction Layer */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    aria-label="Temperature"
                />
                
                {/* Animated Thumb */}
                <div 
                    className="absolute h-7 w-7 bg-white dark:bg-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.2)] border-2 border-transparent rounded-full pointer-events-none transition-all duration-100 ease-out z-10 flex items-center justify-center"
                    style={{ left: `calc(${value * 100}% - 14px)` }}
                >
                    <div className={`w-2 h-2 rounded-full ${value > 0.7 ? 'bg-purple-500' : value > 0.3 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                </div>
            </div>
            
            <div className="flex justify-between mt-2 px-1">
                {[0, 0.5, 1].map((tick) => (
                    <div key={tick} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => !disabled && onChange(tick)}>
                        <div className={`w-1 h-1 rounded-full ${Math.abs(value - tick) < 0.1 ? 'bg-slate-800 dark:bg-slate-200 scale-150' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                ))}
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
        <div className="space-y-10 pb-12">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Intelligence Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fine-tune the cognitive engine and generative capabilities.</p>
            </div>
            
            {noModelsAvailable && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-full flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <p className="font-bold text-sm text-amber-800 dark:text-amber-200">Models Unavailable</p>
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                      Please configure your API key in the General tab to load available models.
                    </p>
                </div>
              </div>
            )}

            {/* Core Intelligence Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <SparklesIcon />
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Cognitive Engine</h4>
                </div>
                
                <div className="grid gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Primary Reasoning Model</label>
                        <ModelSelector 
                            models={models} 
                            selectedModel={selectedModel} 
                            onModelChange={onModelChange} 
                            disabled={disabled || noModelsAvailable} 
                            placeholder="Select a reasoning model"
                            icon={<SparklesIcon />}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">The main model used for chat, reasoning, and planning.</p>
                    </div>

                    <TemperatureControl 
                        value={temperature} 
                        onChange={setTemperature} 
                        disabled={disabled} 
                    />
                </div>
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />

            {/* Multimodal Capabilities Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400">
                        <div className="flex -space-x-1">
                            <PhotoIcon />
                            <VideoIcon />
                        </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Multimodal Suite</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Image Generation</label>
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
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Video Generation</label>
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
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Speech Synthesis (TTS)</label>
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
