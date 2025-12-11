
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

const InstructionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
    colorClass: string;
}> = ({ icon, title, description, value, onChange, disabled, placeholder, colorClass }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-1 sm:p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
    >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4 px-3 pt-3 sm:px-0 sm:pt-0">
            <div className={`p-3 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed opacity-90">
                    {description}
                </p>
            </div>
        </div>
        
        <div className="relative">
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full min-h-[220px] p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-black/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y leading-relaxed custom-scrollbar font-sans"
                spellCheck={false}
            />
            
            {/* Character Count Indicator */}
            <div className="absolute bottom-3 right-3 pointer-events-none px-2 py-1 rounded-md bg-white/80 dark:bg-black/60 text-[10px] font-mono text-slate-400 backdrop-blur-sm border border-slate-100 dark:border-white/5">
                {value.length} chars
            </div>
        </div>
    </motion.div>
);

const CustomInstructionsSettings: React.FC<CustomInstructionsSettingsProps> = ({
    aboutUser,
    setAboutUser,
    aboutResponse,
    setAboutResponse,
    disabled
}) => {
    return (
        <div className="space-y-8 pb-10">
             <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Persona</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 max-w-2xl leading-relaxed">
                    <span className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"><InfoIcon /></span>
                    These instructions are injected into the system prompt for every new chat, shaping how the AI perceives you and how it structures its replies.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <InstructionCard
                    icon={<UserPersonaIcon />}
                    title="User Context"
                    description="What should the AI know about you to provide better responses? Include your profession, expertise level, location, or preferences."
                    value={aboutUser}
                    onChange={setAboutUser}
                    disabled={disabled}
                    placeholder="E.g., I'm a senior software engineer specializing in Python and React. I prefer technical explanations over simplifications. I live in London."
                    colorClass="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                />

                <InstructionCard
                    icon={<ResponseStyleIcon />}
                    title="Response Preferences"
                    description="How would you like the AI to respond? Define the tone, format, length, and style of the output."
                    value={aboutResponse}
                    onChange={setAboutResponse}
                    disabled={disabled}
                    placeholder="E.g., Be concise and direct. Always format code blocks with language tags. Avoid conversational filler. Use analogies to explain complex topics. When solving math, show step-by-step reasoning."
                    colorClass="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                />
            </div>
        </div>
    );
};

export default React.memo(CustomInstructionsSettings);
