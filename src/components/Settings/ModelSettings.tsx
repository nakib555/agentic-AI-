
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Model } from '../../types';
import { ModelSelector } from '../UI/ModelSelector';

// --- Modern Icons ---

const BrainCircuitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 3 2.5 2.5 0 0 0 0 2 2.5 2.5 0 0 0 1.32 3 2.5 2.5 0 0 0 1.98 3 2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-3 2.5 2.5 0 0 0 0-2 2.5 2.5 0 0 0-1.32-3 2.5 2.5 0 0 0-1.98-3 2.5 2.5 0 0 0-4.96.46A2.5 2.5 0 0 0 12 4.5Z" />
        <path d="M12 12v.01" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
);

const AudioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 10v3" />
        <path d="M6 6v11" />
        <path d="M10 3v18" />
        <path d="M14 8v7" />
        <path d="M18 5v13" />
        <path d="M22 10v4" />
    </svg>
);

const LayersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
);

// Modern Temperature Control with embedded styling for list item
const TemperatureControl = ({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    const getLabel = (v: number) => {
        if (v < 0.3) return { text: "Precise", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", desc: "Factual & Deterministic" };
        if (v < 0.7) return { text: "Balanced", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", desc: "Natural & Engaging" };
        return { text: "Creative", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", desc: "Imaginative & Diverse" };
    };
    const label = getLabel(value);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Creativity
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${label.color} ${label.bg}`}>
                            {label.text}
                        </span>
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label.desc}</p>
                </div>
                <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                    {value.toFixed(1)}
                </div>
            </div>
            
            <div className="relative h-8 flex items-center group touch-none">
                {/* Track Background */}
                <div className="absolute inset-x-0 h-2 bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden">
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
                    className="absolute h-5 w-5 bg-white dark:bg-slate-200 shadow-md border border-slate-100 dark:border-transparent rounded-full pointer-events-none transition-all duration-100 ease-out z-10 flex items-center justify-center top-1.5"
                    style={{ left: `calc(${value * 100}% - 10px)` }}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${value > 0.7 ? 'bg-purple-500' : value > 0.3 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                </div>
            </div>
            
            <div className="flex justify-between mt-1 px-1">
                {[0, 0.5, 1].map((tick) => (
                    <button 
                        key={tick} 
                        className="w-4 h-4 flex items-center justify-center focus:outline-none"
                        onClick={() => !disabled && onChange(tick)}
                    >
                        <div className={`w-1 h-1 rounded-full ${Math.abs(value - tick) < 0.1 ? 'bg-slate-800 dark:bg-slate-200 scale-125' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </button>
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Intelligence</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure the cognitive engine and multimodal capabilities.</p>
            </div>
            
            {noModelsAvailable && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
            <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="text-indigo-600 dark:text-indigo-400">
                        <BrainCircuitIcon />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Core Engine</h4>
                </div>
                
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-white/5">
                    {/* Primary Model */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">Primary Model</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Used for reasoning, planning, and chat.</p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                            <ModelSelector 
                                models={models} 
                                selectedModel={selectedModel} 
                                onModelChange={onModelChange} 
                                disabled={disabled || noModelsAvailable} 
                                placeholder="Select a reasoning model"
                                icon={<BrainCircuitIcon />}
                            />
                        </div>
                    </div>

                    {/* Temperature Control */}
                    <div className="p-4 sm:p-5">
                        <TemperatureControl 
                            value={temperature} 
                            onChange={setTemperature} 
                            disabled={disabled} 
                        />
                    </div>
                </div>
            </section>

            {/* Multimodal Capabilities Section */}
            <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="text-pink-600 dark:text-pink-400">
                        <LayersIcon />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Multimodal Suite</h4>
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-white/5">
                    {/* Image Model */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">Image Generation</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Engine for creating visual assets.</p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                            <ModelSelector 
                                models={imageModels} 
                                selectedModel={imageModel} 
                                onModelChange={onImageModelChange} 
                                disabled={disabled || noModelsAvailable} 
                                placeholder="Select image model"
                                icon={<ImageIcon />}
                            />
                        </div>
                    </div>

                    {/* Video Model */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">Video Generation</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Engine for creating motion content.</p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                            <ModelSelector 
                                models={videoModels} 
                                selectedModel={videoModel} 
                                onModelChange={onVideoModelChange} 
                                disabled={disabled || noModelsAvailable} 
                                placeholder="Select video model"
                                icon={<VideoIcon />}
                            />
                        </div>
                    </div>

                    {/* TTS Model */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">Speech Synthesis</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Engine for voice generation.</p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                            <ModelSelector 
                                models={ttsModels} 
                                selectedModel={ttsModel} 
                                onModelChange={onTtsModelChange} 
                                disabled={disabled || noModelsAvailable} 
                                placeholder="Select TTS model"
                                icon={<AudioIcon />}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(ModelSettings);
