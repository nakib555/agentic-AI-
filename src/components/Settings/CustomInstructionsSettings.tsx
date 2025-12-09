
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type CustomInstructionsSettingsProps = {
  aboutUser: string;
  setAboutUser: (prompt: string) => void;
  aboutResponse: string;
  setAboutResponse: (prompt: string) => void;
  disabled: boolean;
};

const InstructionField: React.FC<{
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
}> = ({ label, description, value, onChange, disabled, placeholder }) => (
    <div className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl mb-4 shadow-sm hover:border-indigo-300 dark:hover:border-white/20 transition-colors">
        <div className="mb-4">
            <label className="block text-base font-bold text-slate-800 dark:text-slate-200">{label}</label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="relative group">
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full min-h-[160px] p-4 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-300 dark:border-white/10 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y leading-relaxed shadow-inner"
                aria-disabled={disabled}
            />
            <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414Z" clipRule="evenodd" /></svg>
            </div>
        </div>
    </div>
);


const CustomInstructionsSettings: React.FC<CustomInstructionsSettingsProps> = ({
    aboutUser,
    setAboutUser,
    aboutResponse,
    setAboutResponse,
    disabled
}) => {
    return (
        <div className="space-y-6">
             <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Custom Instructions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Tailor the AI's personality and knowledge to your specific needs.
                </p>
            </div>

            <InstructionField
                label="About You"
                description="What would you like the AI to know about you to provide better responses?"
                value={aboutUser}
                onChange={setAboutUser}
                disabled={disabled}
                placeholder={"E.g., I'm a senior software engineer using Python. I prefer technical depth over simplification."}
            />

            <InstructionField
                label="Response Preferences"
                description="How would you like the AI to respond?"
                value={aboutResponse}
                onChange={setAboutResponse}
                disabled={disabled}
                placeholder={"E.g., Be concise. Always format code blocks with language tags. Use analogies to explain complex topics."}
            />
        </div>
    );
};

export default React.memo(CustomInstructionsSettings);
