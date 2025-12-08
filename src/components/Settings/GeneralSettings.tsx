
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, memo } from 'react';
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

const GeneralSettingsRaw: React.FC<GeneralSettingsProps> = ({ 
    onClearAllChats, onRunTests, onDownloadLogs, onShowDataStructure, apiKey, onSaveApiKey,
    theme, setTheme
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Ref for cleanup of timers
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (saveStatus === 'saving') return; // Prevent double submission

    setSaveStatus('saving');
    setSaveError(null);
    
    try {
        await onSaveApiKey(localApiKey);
        setSaveStatus('saved');
        
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
        setSaveStatus('error');
        setSaveError(error.message || 'Failed to verify API Key.');
    }
  };
  
  const handleClear = () => {
    // Trigger the global confirmation modal via the callback
    onClearAllChats();
  };

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">General Settings</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your API connection, appearance, and data.</p>
      </div>

      <SettingItem 
        label="Gemini API Key" 
        description="Your key is verified securely by the server."
        layout="col"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-2 items-center -ml-1">
            <div className="relative flex-1 flex items-center">
                <input
                type={showApiKey ? "text" : "password"}
                autoComplete="off"
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-black/20 text-base md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                style={{ borderRadius: '0.5rem' }}
                />
                <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
                title={showApiKey ? "Hide API Key" : "Show API Key"}
                >
                {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.18l11-7A1.651 1.651 0 0 1 14.25 2.75h.5A1.651 1.651 0 0 1 16.4 4.3l-11 7a1.651 1.651 0 0 1-2.136-1.18l-1.6-6.5A1.651 1.651 0 0 1 .664 10.59ZM19.336 9.41a1.651 1.651 0 0 1 0 1.18l-11 7A1.651 1.651 0 0 1 5.75 17.25h-.5A1.651 1.651 0 0 1 3.6 15.7l11-7a1.651 1.651 0 0 1 2.136 1.18l1.6 6.5A1.651 1.651 0 0 1 19.336 9.41Z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" /><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" /></svg>
                )}
                </button>
            </div>
            <button
                type="submit"
                disabled={saveStatus === 'saving' || !localApiKey}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 ${
                saveStatus === 'saved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
                {saveStatus === 'saving' && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {saveStatus === 'saved' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
                <span>{saveStatus === 'saving' ? 'Verifying...' : saveStatus === 'saved' ? 'Verified & Saved' : 'Verify & Save'}</span>
            </button>
          </div>
          
          <div className="flex justify-start">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Get a Gemini API Key &rarr;
            </a>
          </div>
          {saveStatus === 'error' && saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-800 break-words flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                <span>{saveError}</span>
            </div>
          )}
        </form>
      </SettingItem>

      <SettingItem label="Appearance" description="Choose your preferred color theme.">
        <div className="w-full max-w-[280px]">
            <ThemeToggle theme={theme} setTheme={setTheme} isCollapsed={false} isDesktop={true} />
        </div>
      </SettingItem>

      <div className="pt-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Data Management</h4>
          
          <SettingItem 
            label="Clear Conversations" 
            description="Permanently delete all chat history from your device."
          >
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
              Delete All Data
            </button>
          </SettingItem>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={onRunTests}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" /></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Run Diagnostics</span>
            </button>

            <button
              onClick={onDownloadLogs}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Download Logs</span>
            </button>

            <button
              onClick={onShowDataStructure}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" /></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Data Structure</span>
            </button>
          </div>
      </div>
    </div>
  );
};

export const GeneralSettings = memo(GeneralSettingsRaw);
