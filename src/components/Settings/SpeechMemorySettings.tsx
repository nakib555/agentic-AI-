
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { ToggleSwitch } from '../UI/ToggleSwitch';
import { SettingItem } from './SettingItem';
import { VoiceSelector } from '../UI/VoiceSelector';
import { ModelSelector } from '../UI/ModelSelector';
import type { Model } from '../../types';

const motion = motionTyped as any;

type SpeechMemorySettingsProps = {
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  disabled: boolean;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  ttsModels: Model[];
  ttsModel: string;
  onTtsModelChange: (modelId: string) => void;
};

const AudioWave = () => (
    <div className="flex items-center gap-0.5 h-4 mx-1">
        {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
                key={i}
                className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                initial={{ height: 4 }}
                animate={{ height: [4, 16, 8, 14, 4] }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                }}
            />
        ))}
    </div>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M5 3.869v16.262c0 .982 1.096 1.58 1.914 1.053l13.009-8.13a1.23 1.23 0 0 0 0-2.108L6.914 2.816C6.096 2.29 5 2.887 5 3.869Z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect width="14" height="14" x="5" y="5" rx="2" />
    </svg>
);

const SpeechMemorySettings: React.FC<SpeechMemorySettingsProps> = ({
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    disabled, ttsVoice, setTtsVoice, ttsModels, ttsModel, onTtsModelChange
}) => {
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const handlePlayPreview = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (isPlayingPreview) {
            setIsPlayingPreview(false);
            return;
        }

        setIsPlayingPreview(true);
        // Simulate playback duration
        setTimeout(() => {
            setIsPlayingPreview(false);
        }, 3000);
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Voice & Memory</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure speech synthesis and long-term memory.</p>
            </div>

            <section>
                <div className="mb-2 px-1">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Speech Synthesis</h4>
                </div>
                
                <SettingItem label="TTS Model" description="The model used for generating speech.">
                    <div className="w-full sm:w-[320px]">
                        <ModelSelector 
                            models={ttsModels} 
                            selectedModel={ttsModel} 
                            onModelChange={onTtsModelChange} 
                            disabled={disabled} 
                            placeholder="Select a TTS model"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 6v14" /><path d="M8 10v6" /><path d="M16 10v6" /><path d="M4 12v2" /><path d="M20 12v2" /></svg>}
                        />
                    </div>
                </SettingItem>

                <SettingItem label="Voice Persona" description="Choose the voice for reading responses aloud.">
                    <div className="w-full flex items-center justify-end gap-3 sm:w-[320px]">
                        <div className="flex-1">
                            <VoiceSelector 
                                selectedVoice={ttsVoice} 
                                onVoiceChange={setTtsVoice} 
                                disabled={disabled}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <AnimatePresence>
                                {isPlayingPreview && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                        animate={{ opacity: 1, width: 'auto', marginRight: 8 }}
                                        exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                    >
                                        <AudioWave />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handlePlayPreview}
                                disabled={disabled}
                                className={`
                                    w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                                    ${isPlayingPreview
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
                                    }
                                `}
                                title={isPlayingPreview ? "Stop Preview" : "Preview Selected Voice"}
                            >
                                {isPlayingPreview ? <StopIcon /> : <PlayIcon />}
                            </button>
                        </div>
                    </div>
                </SettingItem>
            </section>

            <section className="mt-8">
                <div className="mb-2 px-1">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Memory</h4>
                </div>
                
                <SettingItem 
                    label="Active Memory" 
                    description="Allow the AI to learn and remember facts about you."
                    wrapControls={false}
                >
                    <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
                </SettingItem>

                <AnimatePresence>
                    {isMemoryEnabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                            <path d="M12 13v-2" />
                                            <path d="M19 13v-2" />
                                            <path d="M5 13v-2" />
                                            <path d="M2 13h20" />
                                            <path d="M2 17h20" />
                                            <path d="M2 21h20" />
                                            <path d="M4 13V8a8 8 0 0 1 16 0v5" />
                                            <path d="M12 13v-2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Memory Bank</h5>
                                        <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-0.5">
                                            View and edit stored facts.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onManageMemory} 
                                    disabled={disabled}
                                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm"
                                >
                                    Manage Data
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default React.memo(SpeechMemorySettings);
