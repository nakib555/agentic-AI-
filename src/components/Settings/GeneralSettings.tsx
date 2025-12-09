
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SettingItem } from './SettingItem';
import { ThemeToggle } from '../Sidebar/ThemeToggle';
import type { Theme } from '../../hooks/useTheme';

type GeneralSettingsProps = {
  onClearAllChats: () => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  onShowDataStructure: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
    onClearAllChats, onRunTests, onDownloadLogs, onShowDataStructure, apiKey, onSaveApiKey,
    theme, setTheme
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saveStatus === 'saving') return;

    setSaveStatus('saving');
    setSaveError(null);
    
    try {
        await onSaveApiKey(localApiKey);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
        setSaveStatus('error');
        setSaveError(error.message || 'Failed to verify API Key.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">General Settings</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your connection and data.</p>
      </div>

      <SettingItem label="Gemini API Key" description="Required for models to appear." layout="col">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-2 items-center -ml-1">
            <div className="relative flex-1 flex items-center">
                <input
                type={showApiKey ? "text" : "password"}
                autoComplete="off"
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-black/20 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
                </button>
            </div>
            <button
                type="submit"
                disabled={saveStatus === 'saving' || !localApiKey}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {saveStatus === 'saving' ? 'Verifying...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
          </div>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Get API Key &rarr;</a>
          {saveStatus === 'error' && saveError && <p className="text-xs text-red-500">{saveError}</p>}
        </form>
      </SettingItem>

      <SettingItem label="Appearance">
        <div className="w-full max-w-[280px]">
            <ThemeToggle theme={theme} setTheme={setTheme} isCollapsed={false} isDesktop={true} />
        </div>
      </SettingItem>

      <div className="pt-4">
          <SettingItem label="Data Management" description="Actions for your local data.">
            <div className="flex flex-wrap gap-3">
                <button onClick={onClearAllChats} className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Delete All Chats</button>
                <button onClick={onDownloadLogs} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Download Logs</button>
                <button onClick={onShowDataStructure} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Data Tree</button>
            </div>
          </SettingItem>
      </div>
    </div>
  );
};
