
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToggleSwitch } from '../UI/ToggleSwitch';
import { SettingItem } from './SettingItem';

type SpeechMemorySettingsProps = {
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  disabled: boolean;
};

const TTS_VOICES = [
    { id: 'Kore', name: 'Kore', desc: 'Calm & Soothing' },
    { id: 'Puck', name: 'Puck', desc: 'Energetic & Clear' },
    { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Strong & Resonant' },
    { id: 'Zephyr', name: 'Zephyr', desc: 'Soft & Gentle' },
];

export const SpeechMemorySettings: React.FC<SpeechMemorySettingsProps> = ({
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,
    disabled
}) => {
    const [isPlayingSample, setIsPlayingSample] = useState(false);

    const handlePlaySample = () => {
        setIsPlayingSample(!isPlayingSample);
        setTimeout(() => setIsPlayingSample(false), 2000); // Mock playback
    };

    return (
        <div className="space-y-2">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Speech & Memory</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure audio interactions and long-term memory.</p>
            </div>

            <SettingItem 
                label="Conversation Memory" 
                description="Allow the AI to remember details from previous conversations to provide better context over time."
            >
                <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
            </SettingItem>

            {isMemoryEnabled && (
                <div className="py-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900 ml-1 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Stored Memory Data</p>
                        <button 
                            onClick={onManageMemory} 
                            disabled={disabled}
                            className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            View & Edit Memory
                        </button>
                    </div>
                </div>
            )}
            
            <div className="h-px bg-slate-200 dark:bg-white/10 my-4"></div>

            <SettingItem label="Voice Selection" description="Choose the voice used for reading responses aloud.">
                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    <div className="relative">
                        <select 
                            value={ttsVoice}
                            onChange={(e) => setTtsVoice(e.target.value)}
                            disabled={disabled}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                        >
                            {TTS_VOICES.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.name} — {v.desc}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handlePlaySample}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs font-semibold uppercase tracking-wider w-full"
                    >
                        {isPlayingSample ? (
                             <div className="flex items-center gap-1">
                                <span className="w-1 h-3 bg-indigo-500 animate-[pulse_0.6s_infinite]"></span>
                                <span className="w-1 h-4 bg-indigo-500 animate-[pulse_0.8s_infinite]"></span>
                                <span className="w-1 h-2 bg-indigo-500 animate-[pulse_1s_infinite]"></span>
                                <span className="ml-1">Playing...</span>
                             </div>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                                </svg>
                                <span>Preview Voice</span>
                            </>
                        )}
                    </button>
                </div>
            </SettingItem>

            <SettingItem 
                label="Auto-Play Audio" 
                description="Automatically read aloud the AI's response when it finishes generating."
            >
                <ToggleSwitch checked={isAutoPlayEnabled} onChange={setIsAutoPlayEnabled} disabled={disabled} />
            </SettingItem>
        </div>
    );
};
