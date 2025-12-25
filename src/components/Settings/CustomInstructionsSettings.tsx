
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';

const motion = motionTyped as any;

type CustomInstructionsSettingsProps = {
  aboutUser: string;
  setAboutUser: (prompt: string) => void;
  aboutResponse: string;
  setAboutResponse: (prompt: string) => void;
  disabled: boolean;
};

// --- Icons ---

const UserPersonaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ResponseStyleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h.01" />
    <path d="M12 10h.01" />
    <path d="M16 10h.01" />
  </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

// --- Components ---

const InstructionBlock: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
    themeColor: 'blue' | 'purple';
}> = ({ icon, title, description, value, onChange, disabled, placeholder, themeColor }) => {
    
    const colors = {
        blue: {
            bg: "bg-blue-100 dark:bg-blue-500/20",
            text: "text-blue-600 dark:text-blue-400",
            focus: "focus-within:ring-blue-500/20",
            border: "group-hover:border-blue-200 dark:group-hover:border-blue-500/20"
        },
        purple: {
            bg: "bg-purple-100 dark:bg-purple-500/20",
            text: "text-purple-600 dark:text-purple-400",
            focus: "focus-within:ring-purple-500/20",
            border: "group-hover:border-purple-200 dark:group-hover:border-purple-500/20"
        }
    };

    const theme = colors[themeColor];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
        >
            <div className="flex items-start gap-3 mb-3 px-1">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${theme.bg} ${theme.text}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed opacity-90">
                        {description}
                    </p>
                </div>
            </div>
            
            <div className={`relative flex-1 group rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 transition-all duration-300 ${theme.border} shadow-sm overflow-hidden`}>
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full h-full min-h-[280px] p-5 bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-4 ${theme.focus} transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none leading-relaxed custom-scrollbar font-mono`}
                    spellCheck={false}
                />
                
                {/* Character Count Indicator */}
                <div className="absolute bottom-3 right-3 pointer-events-none px-2 py-1 rounded-md bg-slate-100/80 dark:bg-white/5 text-[10px] font-mono text-slate-400 border border-slate-200/50 dark:border-white/5">
                    {value.length} chars
                </div>
            </div>
        </motion.div>
    );
};

const CustomInstructionsSettings: React.FC<CustomInstructionsSettingsProps> = ({
    aboutUser,
    setAboutUser,
    aboutResponse,
    setAboutResponse,
    disabled
}) => {
    return (
        <div className="space-y-6 pb-6">
             <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Persona</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 max-w-2xl leading-relaxed">
                    <span className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"><InfoIcon /></span>
                    These instructions are injected into the system prompt for every new chat, shaping how the AI perceives you and how it structures its replies.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <InstructionBlock
                    icon={<UserPersonaIcon />}
                    title="User Context"
                    description="What should the AI know about you? (Profession, location, etc.)"
                    value={aboutUser}
                    onChange={setAboutUser}
                    disabled={disabled}
                    placeholder="E.g., I'm a senior software engineer specializing in Python and React. I prefer technical explanations over simplifications. I live in London."
                    themeColor="blue"
                />

                <InstructionBlock
                    icon={<ResponseStyleIcon />}
                    title="Response Preferences"
                    description="How should the AI respond? (Tone, format, verbosity)"
                    value={aboutResponse}
                    onChange={setAboutResponse}
                    disabled={disabled}
                    placeholder="E.g., Be concise and direct. Always format code blocks with language tags. Avoid conversational filler. Use analogies to explain complex topics."
                    themeColor="purple"
                />
            </div>
        </div>
    );
};

export default React.memo(CustomInstructionsSettings);
