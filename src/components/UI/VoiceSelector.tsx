
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TTS_VOICES = [
    { id: 'Kore', name: 'Kore', desc: 'Calm & Soothing' },
    { id: 'Puck', name: 'Puck', desc: 'Energetic & Clear' },
    { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Strong & Resonant' },
    { id: 'Zephyr', name: 'Zephyr', desc: 'Soft & Gentle' },
];

type VoiceSelectorProps = {
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    disabled?: boolean;
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selected = TTS_VOICES.find(v => v.id === selectedVoice) || TTS_VOICES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
                    ${isOpen 
                        ? 'bg-white dark:bg-[#1e1e1e] border-indigo-500 shadow-sm' 
                        : 'bg-gray-100/80 dark:bg-[#1e1e1e] border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title="Select Voice"
            >
                <div className={`w-2 h-2 rounded-full ${disabled ? 'bg-gray-400' : 'bg-indigo-500'}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selected.name}</span>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 p-1.5"
                    >
                        <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
                                Gemini Voices
                            </div>
                            {TTS_VOICES.map(voice => (
                                <button
                                    key={voice.id}
                                    onClick={() => {
                                        onVoiceChange(voice.id);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200
                                        ${selectedVoice === voice.id 
                                            ? 'bg-indigo-50 dark:bg-indigo-500/20' 
                                            : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                        ${selectedVoice === voice.id 
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/40 dark:text-indigo-200' 
                                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                                        }
                                    `}>
                                        {voice.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${selectedVoice === voice.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {voice.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {voice.desc}
                                        </p>
                                    </div>
                                    {selectedVoice === voice.id && (
                                        <motion.div 
                                            initial={{ scale: 0 }} 
                                            animate={{ scale: 1 }}
                                            className="w-2 h-2 rounded-full bg-indigo-500 mr-1"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
