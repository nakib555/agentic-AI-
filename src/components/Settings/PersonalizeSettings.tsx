
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

type PersonalizeSettingsProps = {
  aboutUser: string;
  setAboutUser: (prompt: string) => void;
  aboutResponse: string;
  setAboutResponse: (prompt: string) => void;
  disabled: boolean;
};

// --- Options Constants ---

const TONE_OPTIONS = [
    { id: 'default', label: 'Default', desc: 'Balanced & Standard' },
    { id: 'professional', label: 'Professional', desc: 'Polished, precise, corporate' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm, chatty, casual' },
    { id: 'candid', label: 'Candid', desc: 'Direct, honest, encouraging' },
    { id: 'quirky', label: 'Quirky', desc: 'Playful, imaginative, fun' },
    { id: 'efficient', label: 'Efficient', desc: 'Concise, plain, robotic' },
    { id: 'nerdy', label: 'Nerdy', desc: 'Technical, enthusiastic, deep' },
    { id: 'cynical', label: 'Cynical', desc: 'Critical, dry, sarcastic' },
];

const INTENSITY_OPTIONS = [
    { id: 'less', label: 'Less' },
    { id: 'default', label: 'Default' },
    { id: 'more', label: 'More' },
];

// --- UI Components ---

const SegmentedControl: React.FC<{
    label: string;
    icon?: React.ReactNode;
    options: { id: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, icon, options, value, onChange, disabled }) => {
    const id = React.useId();
    
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex p-1 bg-slate-100 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-white/5 relative z-0">
                {options.map((opt) => {
                    const isActive = value === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => !disabled && onChange(opt.id)}
                            disabled={disabled}
                            className={`
                                relative flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200
                                ${isActive 
                                    ? 'text-indigo-600 dark:text-indigo-300' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={`seg-bg-${id}`}
                                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-md shadow-sm border border-black/5 dark:border-white/5"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10">{opt.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const SelectDropdown: React.FC<{
    label: string;
    icon?: React.ReactNode;
    options: { id: string; label: string; desc?: string }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, icon, options, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find(o => o.id === value) || options[0];
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        
        const handleResize = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleResize, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
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
            setCoords({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
            setIsOpen(true);
        }
    };

    return (
        <div className="relative group" ref={containerRef}>
            <div className="flex items-center gap-2 mb-2">
                {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {label}
                </label>
            </div>
            
            <button
                onClick={toggleOpen}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-left transition-all
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50' : 'hover:border-indigo-300 dark:hover:border-indigo-500/30'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
            >
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.label}</span>
                    {selected.desc && <span className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-0.5">{selected.desc}</span>}
                </div>
                <div className={`p-1 rounded-full bg-slate-200 dark:bg-white/10 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-500 dark:text-slate-400">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{ 
                                position: 'absolute',
                                top: coords.top,
                                left: coords.left,
                                width: coords.width,
                                zIndex: 9999
                            }}
                            className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                        >
                            {options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                    className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 ${value === opt.id ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`text-sm font-bold ${value === opt.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {opt.label}
                                    </span>
                                    {opt.desc && <span className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 font-medium">{opt.desc}</span>}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

const TextInput: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    multiline?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
}> = ({ label, placeholder, value, onChange, multiline, disabled, icon }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {label}
        </label>
        <div className="relative group">
            {icon && !multiline && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                    {icon}
                </div>
            )}
            
            {multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 min-h-[100px] resize-none leading-relaxed"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 ${icon ? 'pl-10 pr-4' : 'px-4'}`}
                />
            )}
        </div>
    </div>
);

const PersonalizeSettings: React.FC<PersonalizeSettingsProps> = ({
    aboutUser, setAboutUser, aboutResponse, setAboutResponse, disabled
}) => {
    const [tone, setTone] = useState('default');
    const [warmth, setWarmth] = useState('default');
    const [enthusiasm, setEnthusiasm] = useState('default');
    const [structure, setStructure] = useState('default'); 
    const [emoji, setEmoji] = useState('default');
    
    const [nickname, setNickname] = useState('');
    const [occupation, setOccupation] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [moreAboutUser, setMoreAboutUser] = useState('');

    // --- Parser ---
    useEffect(() => {
        const nicknameMatch = aboutUser.match(/Nickname:\s*(.*?)(?:\n|$)/);
        const occupationMatch = aboutUser.match(/Occupation:\s*(.*?)(?:\n|$)/);
        let cleanAbout = aboutUser
            .replace(/Nickname:\s*(.*?)(?:\n|$)/, '')
            .replace(/Occupation:\s*(.*?)(?:\n|$)/, '')
            .trim();
        
        if (nicknameMatch) setNickname(nicknameMatch[1]);
        if (occupationMatch) setOccupation(occupationMatch[1]);
        if (cleanAbout) setMoreAboutUser(cleanAbout);

        const toneMatch = aboutResponse.match(/Tone:\s*(.*?)(?:\n|$)/);
        const warmthMatch = aboutResponse.match(/Warmth:\s*(.*?)(?:,|$)/);
        const enthMatch = aboutResponse.match(/Enthusiasm:\s*(.*?)(?:,|$)/);
        const structMatch = aboutResponse.match(/Structure:\s*(.*?)(?:,|$)/);
        const emojiMatch = aboutResponse.match(/Emoji:\s*(.*?)(?:,|$)/);
        
        let cleanInstructions = aboutResponse
            .replace(/Tone:.*?\n/, '')
            .replace(/Traits:.*?\n/, '')
            .trim();

        if (toneMatch) setTone(toneMatch[1].toLowerCase());
        if (warmthMatch) setWarmth(warmthMatch[1].toLowerCase());
        if (enthMatch) setEnthusiasm(enthMatch[1].toLowerCase());
        if (structMatch) setStructure(structMatch[1].toLowerCase());
        if (emojiMatch) setEmoji(emojiMatch[1].toLowerCase());
        if (cleanInstructions) setCustomInstructions(cleanInstructions);
    }, []); 

    // --- Serializer ---
    useEffect(() => {
        const parts = [];
        if (nickname) parts.push(`Nickname: ${nickname}`);
        if (occupation) parts.push(`Occupation: ${occupation}`);
        if (moreAboutUser) parts.push(moreAboutUser);
        setAboutUser(parts.join('\n'));
    }, [nickname, occupation, moreAboutUser, setAboutUser]);

    useEffect(() => {
        const traits = [];
        if (warmth !== 'default') traits.push(`Warmth: ${warmth}`);
        if (enthusiasm !== 'default') traits.push(`Enthusiasm: ${enthusiasm}`);
        if (structure !== 'default') traits.push(`Structure: ${structure}`);
        if (emoji !== 'default') traits.push(`Emoji: ${emoji}`);

        const parts = [];
        if (tone !== 'default') parts.push(`Tone: ${tone}`);
        if (traits.length > 0) parts.push(`Traits: ${traits.join(', ')}`);
        if (customInstructions) parts.push(customInstructions);

        setAboutResponse(parts.join('\n'));
    }, [tone, warmth, enthusiasm, structure, emoji, customInstructions, setAboutResponse]);

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="mb-10">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Personalization</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Teach the AI who you are and how it should speak.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                
                {/* Column 1: Persona Tuning */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-indigo-100 dark:border-white/5 pb-3">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15.75 8.25a.75.75 0 0 1 .75.75c0 1.12-.492 2.126-1.27 2.812a.75.75 0 1 1-1.04-1.08.5.5 0 0 0 .02-.022A2.48 2.48 0 0 0 15 9a.75.75 0 0 1 .75-.75Z" /><path d="M15.25 12a.75.75 0 0 1 .75.75c0 4.253-2.662 7.85-6.295 9.175a.75.75 0 0 1-.51-1.41 8.26 8.26 0 0 0 5.305-7.765.75.75 0 0 1 .75-.75Z" /><path fillRule="evenodd" d="M1.5 7.125c0-3.153 2.825-5.352 5.46-4.925.213.035.38.203.404.418.175 1.583.65 3.018 1.378 4.28.324.561.306 1.255-.07 1.803-1.29 1.88-1.29 4.318 0 6.197.376.548.394 1.242.07 1.803a10.45 10.45 0 0 0-1.378 4.28c-.024.215-.191.383-.404.418C4.325 21.977 1.5 19.778 1.5 16.625v-9.5Zm12.651 2.373a.75.75 0 0 1 1.12-.958 5.762 5.762 0 0 1 1.474 4.095.75.75 0 0 1-1.5.022 4.26 4.26 0 0 0-1.094-3.159Z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Style & Tone</h4>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Personality</p>
                        </div>
                    </div>

                    <SelectDropdown 
                        label="Primary Persona" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-500"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a.75.75 0 0 0 1.342.674c.05-.099.125-.183.195-.183h3.75c.07 0 .144.084.195.183a.75.75 0 0 0 1.342-.674c-.108-.215-.396-.634-.936-.634h-4.5Zm.857 6.476c-.321.34-.349.883-.02 1.238.342.368.903.368 1.246 0l1.368-1.468a.747.747 0 0 1 1.048 0l1.368 1.468c.343.368.904.368 1.246 0 .329-.355.301-.898-.02-1.238L13.593 15.3c-.85-.912-2.336-.912-3.186 0l-2.174 2.333-.003.004Z" clipRule="evenodd" /></svg>}
                        value={tone} 
                        onChange={setTone} 
                        options={TONE_OPTIONS} 
                        disabled={disabled}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                        <SegmentedControl 
                            label="Warmth" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-orange-500"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" /></svg>}
                            value={warmth} 
                            onChange={setWarmth} 
                            options={INTENSITY_OPTIONS} 
                            disabled={disabled} 
                        />
                        <SegmentedControl 
                            label="Enthusiasm" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-500"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" /></svg>}
                            value={enthusiasm} 
                            onChange={setEnthusiasm} 
                            options={INTENSITY_OPTIONS} 
                            disabled={disabled} 
                        />
                        <SegmentedControl 
                            label="Formatting" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500"><path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" /></svg>}
                            value={structure} 
                            onChange={setStructure} 
                            options={INTENSITY_OPTIONS} 
                            disabled={disabled} 
                        />
                        <SegmentedControl 
                            label="Emoji Usage" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-teal-500"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a.75.75 0 0 0 1.342.674c.05-.099.125-.183.195-.183h3.75c.07 0 .144.084.195.183a.75.75 0 0 0 1.342-.674c-.108-.215-.396-.634-.936-.634h-4.5Zm.857 6.476c-.321.34-.349.883-.02 1.238.342.368.903.368 1.246 0l1.368-1.468a.747.747 0 0 1 1.048 0l1.368 1.468c.343.368.904.368 1.246 0 .329-.355.301-.898-.02-1.238L13.593 15.3c-.85-.912-2.336-.912-3.186 0l-2.174 2.333-.003.004Z" clipRule="evenodd" /></svg>}
                            value={emoji} 
                            onChange={setEmoji} 
                            options={INTENSITY_OPTIONS} 
                            disabled={disabled} 
                        />
                    </div>

                    <div className="pt-2">
                        <TextInput 
                            label="Custom System Instructions" 
                            value={customInstructions} 
                            onChange={setCustomInstructions} 
                            placeholder="Add specific rules... (e.g. 'Always answer in French', 'Use bullet points', 'Be sarcastic')"
                            multiline
                            disabled={disabled}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500"><path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /><path d="M12 2.25a.75.75 0 0 1 .75.75v18a.75.75 0 0 1-1.5 0v-18a.75.75 0 0 1 .75-.75Z" /></svg>}
                        />
                    </div>
                </div>

                {/* Column 2: User Context */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-pink-100 dark:border-white/5 pb-3">
                        <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">User Profile</h4>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Context about you</p>
                        </div>
                    </div>

                    <TextInput 
                        label="Nickname" 
                        value={nickname} 
                        onChange={setNickname} 
                        placeholder="How should I address you?"
                        disabled={disabled}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>}
                    />

                    <TextInput 
                        label="Occupation / Role" 
                        value={occupation} 
                        onChange={setOccupation} 
                        placeholder="Work context (e.g. Student, Engineer)"
                        disabled={disabled}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500"><path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25Z" clipRule="evenodd" /><path d="M12 15h3.764c.822 0 1.589.44 1.953 1.152 1.757 3.436 1.164 4.382-.063 4.522-2.312.27-4.816.326-7.654.326-2.839 0-5.342-.056-7.654-.326-1.227-.14-1.82-.986-.063-4.522C2.647 15.44 3.414 15 4.236 15H8v1.5a.75.75 0 0 0 1.5 0V15Z" /></svg>}
                    />

                    <TextInput 
                        label="Additional Context" 
                        value={moreAboutUser} 
                        onChange={setMoreAboutUser} 
                        placeholder="I prefer concise answers... I am learning Python... Explain like I'm 5..."
                        multiline
                        disabled={disabled}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /></svg>}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalizeSettings;
