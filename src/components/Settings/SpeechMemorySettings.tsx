
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const AudioWave = () => (
    <div className="flex items-center gap-0.5 h-3 mx-2">
        {[1, 2, 3, 4].map((i) => (
            <motion.div
                key={i}
                className="w-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                initial={{ height: 4 }}
                animate={{ height: [4, 12, 6, 10, 4] }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                }}
            />
        ))}
    </div>
);

export const SpeechMemorySettings: React.FC<SpeechMemorySettingsProps> = ({
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,
    disabled
}) => {
    const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

    const handlePlayPreview = (e: React.MouseEvent, voiceId: string) => {
        e.stopPropagation(); // Prevent selecting the voice when clicking play
        
        if (previewVoiceId === voiceId) {
            setPreviewVoiceId(null); // Stop
            return;
        }

        setPreviewVoiceId(voiceId);
        // Simulate playback duration
        setTimeout(() => {
            setPreviewVoiceId((current) => current === voiceId ? null : current);
        }, 2500);
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
                wrapControls={false}
                className="!border-b-0"
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
                        <div className="pt-2 pb-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-white/10 rounded-lg border border-gray-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Stored Memory Data</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">View learned details</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onManageMemory} 
                                    disabled={disabled}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    View & Edit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="h-px bg-slate-200 dark:bg-white/10 my-4"></div>

            <SettingItem label="Voice Selection" description="Choose the voice used for reading responses aloud." layout="col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TTS_VOICES.map(v => {
                        const isSelected = ttsVoice === v.id;
                        const isPreviewing = previewVoiceId === v.id;

                        return (
                            <motion.div
                                key={v.id}
                                onClick={() => !disabled && setTtsVoice(v.id)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`
                                    relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-400 dark:ring-indigo-400 shadow-sm' 
                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                                    }
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Selection Radio */}
                                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400' : 'border-slate-300 dark:border-slate-500'}`}>
                                        {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex flex-col min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {v.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            {v.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Preview & Audio Wave */}
                                <div className="flex items-center pl-2">
                                    <AnimatePresence>
                                        {isPreviewing && (
                                            <motion.div
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                            >
                                                <AudioWave />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={(e) => handlePlayPreview(e, v.id)}
                                        disabled={disabled}
                                        className={`
                                            w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-1
                                            ${isPreviewing
                                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-300'
                                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }
                                        `}
                                        title={isPreviewing ? "Stop Preview" : "Preview Voice"}
                                    >
                                        {isPreviewing ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Zm7 0a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </SettingItem>

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
