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
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
}> = ({ label, value, onChange, disabled, placeholder }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="mt-2 w-full min-h-[128px] max-h-64 p-3 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 overflow-y-auto placeholder-gray-500 dark:placeholder-slate-400 resize-y"
            aria-disabled={disabled}
        />
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
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Custom Instructions</h3>
            
            <p className="text-sm text-gray-500 dark:text-slate-400">
                Provide details for Gemini to use in its responses. This will apply to all new chats.
            </p>

            <InstructionField
                label="What would you like Gemini to know about you to provide better responses?"
                value={aboutUser}
                onChange={setAboutUser}
                disabled={disabled}
                placeholder={"e.g., I'm a software architect in San Francisco. My work focuses on cloud-native applications in Go. I value concise, technical answers with code examples and diagrams."}
            />

            <InstructionField
                label="How would you like Gemini to respond?"
                value={aboutResponse}
                onChange={setAboutResponse}
                disabled={disabled}
                placeholder={"e.g., Respond as a senior principal engineer. Be formal. Use markdown for structure. Always justify your recommendations with trade-offs. Prefer a direct and professional tone."}
            />
        </div>
    );
};