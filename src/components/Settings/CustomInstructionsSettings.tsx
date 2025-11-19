
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
    <div className="py-4 border-b border-border last:border-0">
        <label className="block text-base font-medium text-content-primary mb-2">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full min-h-[120px] p-3 border border-border rounded-xl bg-layer-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main overflow-y-auto placeholder-content-tertiary resize-y text-content-primary"
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
        <div className="space-y-1">
            <h3 className="text-xl font-bold text-content-primary mb-2 px-1">Custom Instructions</h3>
            
            <p className="text-sm text-content-secondary px-1 mb-2">
                Customize how the AI behaves and what it knows about you.
            </p>

            <InstructionField
                label="About You"
                value={aboutUser}
                onChange={setAboutUser}
                disabled={disabled}
                placeholder={"e.g., I'm a software engineer... I prefer concise answers..."}
            />

            <InstructionField
                label="How should the AI respond?"
                value={aboutResponse}
                onChange={setAboutResponse}
                disabled={disabled}
                placeholder={"e.g., Be formal... Use code examples..."}
            />
        </div>
    );
};
