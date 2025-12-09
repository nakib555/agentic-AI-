
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
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
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
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 2.485.735 4.816 2.035 6.775.341 1.23 1.518 1.895 2.66 1.895h1.933l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 1 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" /></svg>}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" />
                                            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
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
