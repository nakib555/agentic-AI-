
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { ToggleSwitch } from '../UI/ToggleSwitch';
import { SettingItem } from './SettingItem';

const motion = motionTyped as any;

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

export const SpeechMemorySettings: React.FC<SpeechMemorySettingsProps> = ({
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,
    disabled
}) => {
    const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

    const handlePlayPreview = (e: React.MouseEvent, voiceId: string) => {
        e.stopPropagation();
        
        if (previewVoiceId === voiceId) {
            setPreviewVoiceId(null);
            return;
        }

        setPreviewVoiceId(voiceId);
        // Simulate playback duration
        setTimeout(() => {
            setPreviewVoiceId((current) => current === voiceId ? null : current);
        }, 3000);
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Speech & Memory</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure audio interactions and long-term memory.</p>
            </div>

            {/* Memory Section */}
            <div className="space-y-2">
                <SettingItem 
                    label="Conversation Memory" 
                    description="Allow the AI to remember details from previous conversations to provide better context over time."
                    wrapControls={false}
                    className="!border-b-0 pb-2"
                >
                    <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
                </SettingItem>

                <AnimatePresence initial={false}>
                    {isMemoryEnabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="p-1">
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" />
                                                <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Stored Memory Data</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review and edit what the AI knows about you</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onManageMemory} 
                                        disabled={disabled}
                                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-200 dark:border-white/5"
                                    >
                                        View & Edit
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="h-px bg-slate-200 dark:bg-white/10" />

            {/* Voice Selection Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Voice Selection</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose the voice persona for reading responses aloud.</p>
                </div>

                <div className="flex flex-col gap-3">
                    {TTS_VOICES.map(v => {
                        const isSelected = ttsVoice === v.id;
                        const isPreviewing = previewVoiceId === v.id;

                        return (
                            <motion.div
                                key={v.id}
                                onClick={() => !disabled && setTtsVoice(v.id)}
                                whileTap={{ scale: 0.99 }}
                                className={`
                                    relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                                    ${isSelected 
                                        ? 'bg-indigo-50/80 border-indigo-500 shadow-md dark:bg-indigo-500/20 dark:border-indigo-400' 
                                        : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm'
                                    }
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Selection Indicator */}
                                    <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${isSelected 
                                            ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400' 
                                            : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                                        }
                                    `}>
                                        {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />}
                                    </div>

                                    <div className="flex flex-col">
                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {v.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {v.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Preview Control */}
                                <div className="flex items-center gap-3">
                                    <AnimatePresence>
                                        {isPreviewing && (
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
                                        onClick={(e) => handlePlayPreview(e, v.id)}
                                        disabled={disabled}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                                            ${isPreviewing
                                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-300'
                                                : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-indigo-300'
                                            }
                                        `}
                                        title={isPreviewing ? "Stop Preview" : "Preview Voice"}
                                    >
                                        {isPreviewing ? <StopIcon /> : <PlayIcon />}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/10" />

            <SettingItem 
                label="Auto-Play Audio" 
                description="Automatically read aloud the AI's response when it finishes generating."
                wrapControls={false}
            >
                <ToggleSwitch checked={isAutoPlayEnabled} onChange={setIsAutoPlayEnabled} disabled={disabled} />
            </SettingItem>
        </div>
    );
};
