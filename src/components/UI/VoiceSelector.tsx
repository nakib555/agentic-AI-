
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const TTS_VOICES = [
    // Standard Personas
    { id: 'Puck', name: 'Puck', desc: 'Energetic & Clear' },
    { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative' },
    { id: 'Kore', name: 'Kore', desc: 'Calm & Soothing' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Strong & Resonant' },
    { id: 'Zephyr', name: 'Zephyr', desc: 'Soft & Gentle' },
    { id: 'Aoede', name: 'Aoede', desc: 'Confident & Professional' },
    { id: 'Hestia', name: 'Hestia', desc: 'Warm & Composed' },
    { id: 'Leda', name: 'Leda', desc: 'Sophisticated & Balanced' },
    { id: 'Orpheus', name: 'Orpheus', desc: 'Rich & Expressive' },
    { id: 'Thalia', name: 'Thalia', desc: 'Bright & Engaging' },
    
    // International Accents / Styles
    { id: 'British', name: 'British (UK)', desc: 'Distinctive UK Accent' },
    { id: 'American', name: 'American (US)', desc: 'Standard US Accent' },
    { id: 'French', name: 'French', desc: 'Français Accent' },
    { id: 'Japanese', name: 'Japanese', desc: 'Nihongo Accent' },
    { id: 'Chinese', name: 'Chinese', desc: 'Mandarin Accent' },
    { id: 'German', name: 'German', desc: 'Deutsch Accent' },
    { id: 'Spanish', name: 'Spanish', desc: 'Español Accent' },
    { id: 'Italian', name: 'Italian', desc: 'Italiano Accent' },
    { id: 'Russian', name: 'Russian', desc: 'Русский Accent' },
    { id: 'Bengali', name: 'Bengali', desc: 'Bangladesh Accent' },
    { id: 'Indonesian', name: 'Indonesian', desc: 'Bahasa Accent' },
];

type VoiceSelectorProps = {
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    disabled?: boolean;
    className?: string;
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ 
    selectedVoice, 
    onVoiceChange, 
    disabled,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const selected = TTS_VOICES.find(v => v.id === selectedVoice) || TTS_VOICES[0];
    
    // State to hold the calculated position of the menu
    const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        
        const handleScrollOrResize = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleScrollOrResize);
            window.addEventListener('scroll', handleScrollOrResize, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    const toggleOpen = () => {
        if (disabled) return;
        
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;
            const menuHeight = 320; 

            // Intelligent placement
            const showOnTop = spaceBelow < menuHeight && spaceAbove > spaceBelow;

            setCoords({
                left: rect.left,
                width: rect.width,
                top: showOnTop ? undefined : rect.bottom + 8,
                bottom: showOnTop ? windowHeight - rect.top + 8 : undefined
            });
            
            setIsOpen(true);
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                disabled={disabled}
                className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
                    ${isOpen 
                        ? 'bg-white dark:bg-[#1e1e1e] border-indigo-500 shadow-sm' 
                        : 'bg-gray-100/80 dark:bg-[#1e1e1e] border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title="Select Voice Persona"
            >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${disabled ? 'bg-gray-400' : 'bg-indigo-500'}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate flex-1 text-left">{selected.name}</span>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, y: coords.bottom ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: coords.bottom ? 10 : -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                width: coords.width,
                                top: coords.top,
                                bottom: coords.bottom,
                                zIndex: 99999,
                            }}
                            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden p-1.5"
                        >
                            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#1e1e1e] z-10 flex justify-between">
                                    <span>Gemini Personas</span>
                                    <span className="text-[10px] font-normal opacity-70">Multilingual</span>
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
                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0
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
                                                className="w-2 h-2 rounded-full bg-indigo-500 mr-1 flex-shrink-0"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
