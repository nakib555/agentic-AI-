
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    className?: string;
}> = ({ label, icon, options, value, onChange, disabled, className }) => {
    const id = React.useId();
    
    return (
        <div className={`flex flex-col gap-3 ${className || ''}`}>
            <div className="flex items-center gap-2.5 px-1">
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex p-1.5 bg-slate-100/80 dark:bg-black/40 rounded-xl border border-slate-200/50 dark:border-white/5 relative z-0">
                {options.map((opt) => {
                    const isActive = value === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => !disabled && onChange(opt.id)}
                            disabled={disabled}
                            className={`
                                relative flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-200
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
                                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm border border-black/5 dark:border-white/5"
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
    const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({ left: 0, width: 0, maxHeight: 300 });

    const updatePosition = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // Prefer showing below, but flip to top if cramped (< 220px) and there is more space above
            const showOnTop = spaceBelow < 220 && spaceAbove > spaceBelow;
            
            const padding = 8;
            const maxHeight = showOnTop 
                ? Math.min(spaceAbove - padding * 2, 300) 
                : Math.min(spaceBelow - padding * 2, 300);

            setCoords({
                left: rect.left,
                width: rect.width,
                top: showOnTop ? undefined : rect.bottom + padding,
                bottom: showOnTop ? viewportHeight - rect.top + padding : undefined,
                maxHeight: Math.max(100, maxHeight)
            });
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // Capture phase handles scroll in parents
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const toggleOpen = () => {
        if (disabled) return;
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative group flex flex-col gap-3" ref={containerRef}>
            <div className="flex items-center gap-2.5 px-1">
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {label}
                </label>
            </div>
            
            <button
                onClick={toggleOpen}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-left transition-all
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50' : 'hover:border-indigo-300 dark:hover:border-indigo-500/30'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.label}</span>
                    {selected.desc && <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">{selected.desc}</span>}
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
                            initial={{ opacity: 0, y: coords.bottom ? 10 : -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.bottom ? 10 : -10, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{ 
                                position: 'fixed',
                                top: coords.top,
                                bottom: coords.bottom,
                                left: coords.left,
                                width: coords.width,
                                zIndex: 99999
                            }}
                            className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5"
                        >
                            <div 
                                className="overflow-y-auto custom-scrollbar"
                                style={{ maxHeight: coords.maxHeight }}
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
                            </div>
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
    onBlur: () => void;
    multiline?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
}> = ({ label, placeholder, value, onChange, onBlur, multiline, disabled, icon }) => (
    <div className="flex flex-col gap-3">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2.5 px-1">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {label}
        </label>
        <div className="relative group">
            {multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 min-h-[120px] resize-none leading-relaxed"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
            )}
        </div>
    </div>
);

const SectionHeader: React.FC<{
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}> = ({ title, subtitle, icon, color, bg }) => (
    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-4 mb-2">
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
            {icon}
        </div>
        <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h4>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{subtitle}</p>
        </div>
    </div>
);

const PersonalizeSettings: React.FC<PersonalizeSettingsProps> = ({
    aboutUser, setAboutUser, aboutResponse, setAboutResponse, disabled
}) => {
    // Local state for UI controls
    const [tone, setTone] = useState('default');
    const [warmth, setWarmth] = useState('default');
    const [enthusiasm, setEnthusiasm] = useState('default');
    const [structure, setStructure] = useState('default'); 
    const [emoji, setEmoji] = useState('default');
    
    const [nickname, setNickname] = useState('');
    const [occupation, setOccupation] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [moreAboutUser, setMoreAboutUser] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // --- Parsing Logic (Executed Once on Mount) ---
    useEffect(() => {
        // Parse "About User"
        const nicknameMatch = aboutUser.match(/Nickname:\s*(.*?)(?:\n|$)/);
        const occupationMatch = aboutUser.match(/Occupation:\s*(.*?)(?:\n|$)/);
        
        // Remove parsed keys to find the "rest" of the content
        let cleanAbout = aboutUser
            .replace(/^Nickname:.*$/m, '')
            .replace(/^Occupation:.*$/m, '')
            .trim();
        
        if (nicknameMatch) setNickname(nicknameMatch[1]);
        if (occupationMatch) setOccupation(occupationMatch[1]);
        if (cleanAbout) setMoreAboutUser(cleanAbout);

        // Parse "About Response"
        const toneMatch = aboutResponse.match(/Tone:\s*(.*?)(?:\n|$)/);
        const warmthMatch = aboutResponse.match(/Warmth:\s*([^,]+)/);
        const enthMatch = aboutResponse.match(/Enthusiasm:\s*([^,]+)/);
        const structMatch = aboutResponse.match(/Structure:\s*([^,]+)/);
        const emojiMatch = aboutResponse.match(/Emoji:\s*([^,]+)/);
        
        let cleanInstructions = aboutResponse
            .replace(/^Tone:.*$/m, '')
            .replace(/^Traits:.*$/m, '')
            .trim();

        if (toneMatch) setTone(toneMatch[1].toLowerCase().trim());
        if (warmthMatch) setWarmth(warmthMatch[1].toLowerCase().trim());
        if (enthMatch) setEnthusiasm(enthMatch[1].toLowerCase().trim());
        if (structMatch) setStructure(structMatch[1].toLowerCase().trim());
        if (emojiMatch) setEmoji(emojiMatch[1].toLowerCase().trim());
        if (cleanInstructions) setCustomInstructions(cleanInstructions);
    }, []); // Empty dependency array = run once on mount

    // --- Update Logic (Event Driven) ---

    const updateAboutUser = (newNickname: string, newOccupation: string, newMore: string) => {
        const parts = [];
        if (newNickname.trim()) parts.push(`Nickname: ${newNickname.trim()}`);
        if (newOccupation.trim()) parts.push(`Occupation: ${newOccupation.trim()}`);
        if (newMore.trim()) parts.push(newMore.trim());
        setAboutUser(parts.join('\n'));
    };

    const updateAboutResponse = (t: string, w: string, e: string, s: string, em: string, ci: string) => {
        const traits = [];
        if (w !== 'default') traits.push(`Warmth: ${w}`);
        if (e !== 'default') traits.push(`Enthusiasm: ${e}`);
        if (s !== 'default') traits.push(`Structure: ${s}`);
        if (em !== 'default') traits.push(`Emoji: ${em}`);

        const parts = [];
        if (t !== 'default') parts.push(`Tone: ${t}`);
        if (traits.length > 0) parts.push(`Traits: ${traits.join(', ')}`);
        if (ci.trim()) parts.push(ci.trim());

        setAboutResponse(parts.join('\n'));
    };

    // Commits for TextInputs (onBlur)
    const commitUserChanges = () => updateAboutUser(nickname, occupation, moreAboutUser);
    const commitResponseChanges = () => updateAboutResponse(tone, warmth, enthusiasm, structure, emoji, customInstructions);

    // Handlers for Selects/Segmented Controls (Immediate Update)
    const handleToneChange = (val: string) => { setTone(val); updateAboutResponse(val, warmth, enthusiasm, structure, emoji, customInstructions); };
    const handleWarmthChange = (val: string) => { setWarmth(val); updateAboutResponse(tone, val, enthusiasm, structure, emoji, customInstructions); };
    const handleEnthusiasmChange = (val: string) => { setEnthusiasm(val); updateAboutResponse(tone, warmth, val, structure, emoji, customInstructions); };
    const handleStructureChange = (val: string) => { setStructure(val); updateAboutResponse(tone, warmth, enthusiasm, val, emoji, customInstructions); };
    const handleEmojiChange = (val: string) => { setEmoji(val); updateAboutResponse(tone, warmth, enthusiasm, structure, val, customInstructions); };

    // Explicit Save Handler
    const handleManualSave = async () => {
        setIsSaving(true);
        // Force commit updates from local state
        updateAboutUser(nickname, occupation, moreAboutUser);
        updateAboutResponse(tone, warmth, enthusiasm, structure, emoji, customInstructions);
        
        // Artificial delay to show process (updates are usually instant)
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="pb-10 max-w-6xl mx-auto">
            {/* Header with Save Button */}
            <div className="mb-12 border-b border-gray-100 dark:border-white/5 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11l4 4"/><path d="M16 11l-4 4"/></svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Personalization</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Customize the AI's personality and your profile.</p>
                    </div>
                </div>

                <button 
                    onClick={handleManualSave}
                    disabled={disabled || isSaving}
                    className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95
                        ${isSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Saving...</span>
                        </>
                    ) : isSaved ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                            <span>Saved</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-20 items-start">
                
                {/* Column 1: Persona Tuning */}
                <div className="flex flex-col gap-10">
                    <SectionHeader 
                        title="Style & Tone" 
                        subtitle="AI Personality" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5H3"/><path d="M19 19v4"/><path d="M21 21h-4"/></svg>}
                        color="text-fuchsia-600 dark:text-fuchsia-400" 
                        bg="bg-fuchsia-50 dark:bg-fuchsia-500/10" 
                    />

                    <div className="space-y-10 pl-1">
                        <SelectDropdown 
                            label="Primary Persona" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-fuchsia-500"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>}
                            value={tone} 
                            onChange={handleToneChange} 
                            options={TONE_OPTIONS} 
                            disabled={disabled}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            <SegmentedControl 
                                label="Warmth" 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-500"><path d="M19 14c1.49-1.28 3.6-1.28 5.09 0 1.49 1.28 1.49 3.36 0 4.63s-3.6 1.28-5.09 0c-1.49-1.28-1.49-3.36 0-4.63z"/><path d="M11.23 8.8c-2.73-1.53-2.92-3.8-2.92-3.8s-3.23 2-1.72 6.8c1.33 4.2 3.64 6.7 9.42 7.2 4.47.38 6.75-2.26 6.75-2.26s-1.57 3.53-7.51 3.26c-5.7-.26-7.82-3.66-9.15-7.87C4.7 8.1 7.21 4.7 7.21 4.7s2.21 2.37 4.02 4.1z"/></svg>}
                                value={warmth} 
                                onChange={handleWarmthChange} 
                                options={INTENSITY_OPTIONS} 
                                disabled={disabled} 
                            />
                            <SegmentedControl 
                                label="Enthusiasm" 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                                value={enthusiasm} 
                                onChange={handleEnthusiasmChange} 
                                options={INTENSITY_OPTIONS} 
                                disabled={disabled} 
                            />
                            <SegmentedControl 
                                label="Formatting" 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>}
                                value={structure} 
                                onChange={handleStructureChange} 
                                options={INTENSITY_OPTIONS} 
                                disabled={disabled}
                                className="pt-2"
                            />
                            <SegmentedControl 
                                label="Emoji Usage" 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-teal-500"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
                                value={emoji} 
                                onChange={handleEmojiChange} 
                                options={INTENSITY_OPTIONS} 
                                disabled={disabled}
                                className="pt-2"
                            />
                        </div>

                        <TextInput 
                            label="Custom System Instructions" 
                            value={customInstructions} 
                            onChange={setCustomInstructions} 
                            onBlur={commitResponseChanges}
                            placeholder="Add specific rules... (e.g. 'Always answer in French', 'Use bullet points', 'Be sarcastic')"
                            multiline
                            disabled={disabled}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
                        />
                    </div>
                </div>

                {/* Column 2: User Context */}
                <div className="flex flex-col gap-10">
                    <SectionHeader 
                        title="User Profile" 
                        subtitle="Your Context" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                        color="text-cyan-600 dark:text-cyan-400" 
                        bg="bg-cyan-50 dark:bg-cyan-500/10" 
                    />

                    <div className="space-y-10 pl-1">
                        <TextInput 
                            label="Nickname" 
                            value={nickname} 
                            onChange={setNickname} 
                            onBlur={commitUserChanges}
                            placeholder="How should I address you?"
                            disabled={disabled}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-cyan-500"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>}
                        />

                        <TextInput 
                            label="Occupation / Role" 
                            value={occupation} 
                            onChange={setOccupation} 
                            onBlur={commitUserChanges}
                            placeholder="Work context (e.g. Student, Engineer)"
                            disabled={disabled}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-500"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                        />

                        <TextInput 
                            label="Additional Context" 
                            value={moreAboutUser} 
                            onChange={setMoreAboutUser} 
                            onBlur={commitUserChanges}
                            placeholder="I prefer concise answers... I am learning Python... Explain like I'm 5..."
                            multiline
                            disabled={disabled}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-rose-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizeSettings;
