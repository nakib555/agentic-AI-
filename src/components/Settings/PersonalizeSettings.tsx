
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
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
    options: { id: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, options, value, onChange, disabled }) => {
    const id = React.useId();
    
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
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
    options: { id: string; label: string; desc?: string }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, options, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find(o => o.id === value) || options[0];
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative group" ref={containerRef}>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">
                {label}
            </label>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
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

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
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
            </AnimatePresence>
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
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
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
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Personalization</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Teach the AI who you are and how it should speak.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                
                {/* Column 1: Persona Tuning */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-100 dark:border-white/5 pb-4">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15.75 8.25a.75.75 0 0 1 .75.75c0 1.12-.492 2.126-1.27 2.812a.75.75 0 1 1-1.04-1.08.5.5 0 0 0 .02-.022A2.48 2.48 0 0 0 15 9a.75.75 0 0 1 .75-.75Z" /><path d="M15.25 12a.75.75 0 0 1 .75.75c0 4.253-2.662 7.85-6.295 9.175a.75.75 0 0 1-.51-1.41 8.26 8.26 0 0 0 5.305-7.765.75.75 0 0 1 .75-.75Z" /><path fillRule="evenodd" d="M1.5 7.125c0-3.153 2.825-5.352 5.46-4.925.213.035.38.203.404.418.175 1.583.65 3.018 1.378 4.28.324.561.306 1.255-.07 1.803-1.29 1.88-1.29 4.318 0 6.197.376.548.394 1.242.07 1.803a10.45 10.45 0 0 0-1.378 4.28c-.024.215-.191.383-.404.418C4.325 21.977 1.5 19.778 1.5 16.625v-9.5Zm12.651 2.373a.75.75 0 0 1 1.12-.958 5.762 5.762 0 0 1 1.474 4.095.75.75 0 0 1-1.5.022 4.26 4.26 0 0 0-1.094-3.159Z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Style & Tone</h4>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Personality</p>
                        </div>
                    </div>

                    <SelectDropdown 
                        label="Primary Persona" 
                        value={tone} 
                        onChange={setTone} 
                        options={TONE_OPTIONS} 
                        disabled={disabled}
                    />

                    <div className="space-y-5 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <SegmentedControl label="Warmth" value={warmth} onChange={setWarmth} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SegmentedControl label="Enthusiasm" value={enthusiasm} onChange={setEnthusiasm} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SegmentedControl label="Formatting" value={structure} onChange={setStructure} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SegmentedControl label="Emoji Usage" value={emoji} onChange={setEmoji} options={INTENSITY_OPTIONS} disabled={disabled} />
                        </div>
                    </div>

                    <div className="pt-2">
                        <TextInput 
                            label="Custom System Instructions" 
                            value={customInstructions} 
                            onChange={setCustomInstructions} 
                            placeholder="Add specific rules... (e.g. 'Always answer in French', 'Use bullet points', 'Be sarcastic')"
                            multiline
                            disabled={disabled}
                        />
                    </div>
                </div>

                {/* Column 2: User Context */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-100 dark:border-white/5 pb-4">
                        <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 shadow-sm border border-pink-100 dark:border-white/5">
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
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>}
                    />

                    <TextInput 
                        label="Occupation / Role" 
                        value={occupation} 
                        onChange={setOccupation} 
                        placeholder="Work context (e.g. Student, Engineer)"
                        disabled={disabled}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25Z" clipRule="evenodd" /><path d="M12 15h3.764c.822 0 1.589.44 1.953 1.152 1.757 3.436 1.164 4.382-.063 4.522-2.312.27-4.816.326-7.654.326-2.839 0-5.342-.056-7.654-.326-1.227-.14-1.82-.986-.063-4.522C2.647 15.44 3.414 15 4.236 15H8v1.5a.75.75 0 0 0 1.5 0V15Z" /></svg>}
                    />

                    <TextInput 
                        label="Additional Context" 
                        value={moreAboutUser} 
                        onChange={setMoreAboutUser} 
                        placeholder="I prefer concise answers... I am learning Python... Explain like I'm 5..."
                        multiline
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalizeSettings;
