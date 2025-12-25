
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
    { id: 'default', label: 'Default', desc: 'Preset style and tone' },
    { id: 'professional', label: 'Professional', desc: 'Polished and precise' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm and chatty' },
    { id: 'candid', label: 'Candid', desc: 'Direct and encouraging' },
    { id: 'quirky', label: 'Quirky', desc: 'Playful and imaginative' },
    { id: 'efficient', label: 'Efficient', desc: 'Concise and plain' },
    { id: 'nerdy', label: 'Nerdy', desc: 'Exploratory and enthusiastic' },
    { id: 'cynical', label: 'Cynical', desc: 'Critical and sarcastic' },
];

const INTENSITY_OPTIONS = [
    { id: 'less', label: 'Less' },
    { id: 'default', label: 'Default' },
    { id: 'more', label: 'More' },
];

// --- UI Components ---

const SelectDropdown: React.FC<{
    label: string;
    options: { id: string; label: string; desc?: string }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, options, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find(o => o.id === value) || options[0];
    const containerRef = React.useRef<HTMLDivElement>(null);

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
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                {label}
            </label>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full flex items-center justify-between bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.label}</span>
                    {selected.desc && <span className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{selected.desc}</span>}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#202023] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 ${value === opt.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
                            >
                                <span className={`text-sm font-medium ${value === opt.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {opt.label}
                                </span>
                                {opt.desc && <span className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{opt.desc}</span>}
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
}> = ({ label, placeholder, value, onChange, multiline, disabled }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
        {multiline ? (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-4 py-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 min-h-[120px] resize-none"
            />
        ) : (
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-4 py-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
        )}
    </div>
);

const PersonalizeSettings: React.FC<PersonalizeSettingsProps> = ({
    aboutUser, setAboutUser, aboutResponse, setAboutResponse, disabled
}) => {
    // Local state to manage the structured inputs before serializing to the main text blobs
    const [tone, setTone] = useState('default');
    const [warmth, setWarmth] = useState('default');
    const [enthusiasm, setEnthusiasm] = useState('default');
    const [structure, setStructure] = useState('default'); // Headers & Lists
    const [emoji, setEmoji] = useState('default');
    
    const [nickname, setNickname] = useState('');
    const [occupation, setOccupation] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [moreAboutUser, setMoreAboutUser] = useState('');

    // --- Parser: Load initial state from strings ---
    useEffect(() => {
        // Parse About User
        const nicknameMatch = aboutUser.match(/Nickname:\s*(.*?)(?:\n|$)/);
        const occupationMatch = aboutUser.match(/Occupation:\s*(.*?)(?:\n|$)/);
        // Extract rest (More info) by removing known fields
        let cleanAbout = aboutUser
            .replace(/Nickname:\s*(.*?)(?:\n|$)/, '')
            .replace(/Occupation:\s*(.*?)(?:\n|$)/, '')
            .trim();
        
        if (nicknameMatch) setNickname(nicknameMatch[1]);
        if (occupationMatch) setOccupation(occupationMatch[1]);
        if (cleanAbout) setMoreAboutUser(cleanAbout);

        // Parse About Response
        const toneMatch = aboutResponse.match(/Tone:\s*(.*?)(?:\n|$)/);
        const warmthMatch = aboutResponse.match(/Warmth:\s*(.*?)(?:,|$)/);
        const enthMatch = aboutResponse.match(/Enthusiasm:\s*(.*?)(?:,|$)/);
        const structMatch = aboutResponse.match(/Structure:\s*(.*?)(?:,|$)/);
        const emojiMatch = aboutResponse.match(/Emoji:\s*(.*?)(?:,|$)/);
        
        // Extract custom instructions (everything after the structured block)
        // We look for a separator or just heuristics
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
        
    }, []); // Only run once on mount

    // --- Serializer: Update parent state when local state changes ---
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
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Personalization</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize how the AI communicates and what it knows about you.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
                {/* Column 1: Persona */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15.75 8.25a.75.75 0 0 1 .75.75c0 1.12-.492 2.126-1.27 2.812a.75.75 0 1 1-1.04-1.08.5.5 0 0 0 .02-.022A2.48 2.48 0 0 0 15 9a.75.75 0 0 1 .75-.75Z" /><path d="M15.25 12a.75.75 0 0 1 .75.75c0 4.253-2.662 7.85-6.295 9.175a.75.75 0 0 1-.51-1.41 8.26 8.26 0 0 0 5.305-7.765.75.75 0 0 1 .75-.75Z" /><path fillRule="evenodd" d="M1.5 7.125c0-3.153 2.825-5.352 5.46-4.925.213.035.38.203.404.418.175 1.583.65 3.018 1.378 4.28.324.561.306 1.255-.07 1.803-1.29 1.88-1.29 4.318 0 6.197.376.548.394 1.242.07 1.803a10.45 10.45 0 0 0-1.378 4.28c-.024.215-.191.383-.404.418C4.325 21.977 1.5 19.778 1.5 16.625v-9.5Zm12.651 2.373a.75.75 0 0 1 1.12-.958 5.762 5.762 0 0 1 1.474 4.095.75.75 0 0 1-1.5.022 4.26 4.26 0 0 0-1.094-3.159Z" clipRule="evenodd" /></svg>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Style & Tone</h4>
                    </div>

                    <SelectDropdown 
                        label="Base style and tone" 
                        value={tone} 
                        onChange={setTone} 
                        options={TONE_OPTIONS} 
                        disabled={disabled}
                    />

                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Characteristics</label>
                        <div className="grid grid-cols-2 gap-4">
                            <SelectDropdown label="Warmth" value={warmth} onChange={setWarmth} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SelectDropdown label="Enthusiasm" value={enthusiasm} onChange={setEnthusiasm} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SelectDropdown label="Headers & Lists" value={structure} onChange={setStructure} options={INTENSITY_OPTIONS} disabled={disabled} />
                            <SelectDropdown label="Emoji" value={emoji} onChange={setEmoji} options={INTENSITY_OPTIONS} disabled={disabled} />
                        </div>
                    </div>

                    <TextInput 
                        label="Custom instructions" 
                        value={customInstructions} 
                        onChange={setCustomInstructions} 
                        placeholder="E.g., Always call me 'darling', use a romantic style, be verbose..."
                        multiline
                        disabled={disabled}
                    />
                </div>

                {/* Column 2: User Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">About you</h4>
                    </div>

                    <TextInput 
                        label="Nickname" 
                        value={nickname} 
                        onChange={setNickname} 
                        placeholder="What should the AI call you?"
                        disabled={disabled}
                    />

                    <TextInput 
                        label="Occupation" 
                        value={occupation} 
                        onChange={setOccupation} 
                        placeholder="Work or hobby context"
                        disabled={disabled}
                    />

                    <TextInput 
                        label="More about you" 
                        value={moreAboutUser} 
                        onChange={setMoreAboutUser} 
                        placeholder="I like simple explanations... I am learning Python..."
                        multiline
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalizeSettings;
