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
        <label className="text-sm font-semibold text-text-primary">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="mt-2 w-full min-h-[128px] max-h-64 p-3 border border-color rounded-lg shadow-sm bg-ui-100/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary overflow-y-auto placeholder-text-muted resize-y"
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
            <h3 className="text-xl font-bold text-text-primary">Custom Instructions</h3>
            
            <p className="text-sm text-text-muted">
                Provide details for the AI to use in its responses. This will apply to all new chats.
            </p>

            <InstructionField
                label="What would you like the AI to know about you to provide better responses?"
                value={aboutUser}
                onChange={setAboutUser}
                disabled={disabled}
                placeholder={"e.g., I'm a software engineer working on a project in London. I prefer code examples in TypeScript. My goal is to learn about building scalable web applications."}
            />

            <InstructionField
                label="How would you like the AI to respond?"
                value={aboutResponse}
                onChange={setAboutResponse}
                disabled={disabled}
                placeholder={"e.g., Act as a senior software architect. Be formal and provide detailed, technical explanations. Always include code examples when relevant. Structure responses with clear headings."}
            />
        </div>
    );
};