
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
    <div className="mb-8 last:mb-0">
        <div className="mb-3">
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">{label}</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <div className="relative">
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full min-h-[140px] p-4 bg-slate-100/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-black/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y leading-relaxed"
                aria-disabled={disabled}
            />
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
        <div className="space-y-2">
             <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Custom Instructions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Tailor the AI's personality and knowledge base.
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
