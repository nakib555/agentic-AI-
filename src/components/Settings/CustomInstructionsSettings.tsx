
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
    <div className="py-4">
        <div className="mb-3">
            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">{label}</label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <div className="relative group">
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full min-h-[140px] p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-black/20 text-base md:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-y leading-relaxed"
                aria-disabled={disabled}
            />
            <div className="absolute bottom-3 right-3 pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300 dark:text-slate-600"><path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414Z" clipRule="evenodd" /></svg>
            </div>
        </div>
    </div>
);


export const CustomInstructionsSettings: React.FC<CustomInstructionsSettingsProps> = ({
    aboutUser,
    setAboutUser,
    aboutResponse,
    setAboutResponse,
    disabled
}) => {
    return (
        <div className="space-y-2">
             <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Custom Instructions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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

            <div className="h-px bg-slate-200 dark:bg-white/10 my-2"></div>

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
