/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToggleSwitch } from '../UI/ToggleSwitch';

type SpeechMemorySettingsProps = {
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  disabled: boolean;
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">{description}</p>
        {children}
    </div>
);

const TTS_VOICES = [
    { id: 'Kore', name: 'Kore' },
    { id: 'Puck', name: 'Puck' },
    { id: 'Charon', name: 'Charon' },
    { id: 'Fenrir', name: 'Fenrir' },
    { id: 'Zephyr', name: 'Zephyr' },
];

export const SpeechMemorySettings: React.FC<SpeechMemorySettingsProps> = ({
    isMemoryEnabled, setIsMemoryEnabled, onManageMemory,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,
    disabled
}) => {
    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Speech & Memory</h3>

            <SettingField label="Conversation Memory" description="Allow the AI to remember key details across chats for a more personalized experience.">
                <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">Enable Memory</span>
                    <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
                </div>
                <button 
                    onClick={onManageMemory} 
                    disabled={!isMemoryEnabled || disabled}
                    className="w-full mt-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Manage Memory
                </button>
            </SettingField>

            <SettingField label="Text-to-Speech Voice" description="Select the voice for the 'Listen' feature on AI messages.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TTS_VOICES.map((voice) => (
                        <button
                            key={voice.id}
                            onClick={() => setTtsVoice(voice.id)}
                            disabled={disabled}
                            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                                ttsVoice === voice.id
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/50'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {voice.name}
                        </button>
                    ))}
                </div>
            </SettingField>

            <SettingField label="Auto-Play Audio" description="Automatically play the audio for new AI messages when they are complete.">
                <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">Enable Auto-Play</span>
                    <ToggleSwitch checked={isAutoPlayEnabled} onChange={setIsAutoPlayEnabled} disabled={disabled} />
                </div>
            </SettingField>
        </div>
    );
};