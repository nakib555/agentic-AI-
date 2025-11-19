
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToggleSwitch } from '../UI/ToggleSwitch';
import { SettingItem } from './SettingItem';

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
    const [isPlayingSample, setIsPlayingSample] = useState(false);

    const handlePlaySample = () => {
        setIsPlayingSample(!isPlayingSample);
        setTimeout(() => setIsPlayingSample(false), 2000); // Mock playback
    };

    return (
        <div className="space-y-1">
            <h3 className="text-xl font-bold text-content-primary mb-4 px-1">Speech & Memory</h3>

            <SettingItem 
                label="Conversation Memory" 
                description="Remember details across chats."
            >
                <ToggleSwitch checked={isMemoryEnabled} onChange={setIsMemoryEnabled} disabled={disabled} />
            </SettingItem>

            {isMemoryEnabled && (
                <div className="py-3 border-b border-border">
                    <button 
                        onClick={onManageMemory} 
                        disabled={disabled}
                        className="w-full px-4 py-2 text-sm font-semibold text-primary-text bg-primary-subtle hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Manage Stored Memory
                    </button>
                </div>
            )}

            <SettingItem label="Voice">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePlaySample}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-layer-2 hover:bg-layer-3 text-content-primary transition-colors text-sm font-medium"
                        aria-label={isPlayingSample ? "Stop preview" : "Preview voice"}
                    >
                        {isPlayingSample ? (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <rect x="6" y="5" width="3" height="10" rx="1" />
                                <rect x="11" y="5" width="3" height="10" rx="1" />
                             </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 ml-0.5">
                                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                            </svg>
                        )}
                        <span>Play</span>
                    </button>
                    
                    <div className="relative group">
                        <select 
                            value={ttsVoice}
                            onChange={(e) => setTtsVoice(e.target.value)}
                            disabled={disabled}
                            className="appearance-none bg-transparent text-content-primary font-medium pr-7 pl-2 py-1 focus:outline-none cursor-pointer text-right hover:text-primary-main transition-colors"
                        >
                            {TTS_VOICES.map(v => (
                                <option key={v.id} value={v.id} className="bg-layer-1 text-content-primary">
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-content-tertiary group-hover:text-content-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </SettingItem>

            <SettingItem 
                label="Auto-Play Audio" 
                description="Play responses automatically."
            >
                <ToggleSwitch checked={isAutoPlayEnabled} onChange={setIsAutoPlayEnabled} disabled={disabled} />
            </SettingItem>
        </div>
    );
};
