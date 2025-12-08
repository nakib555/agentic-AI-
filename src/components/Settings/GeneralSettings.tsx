
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
    
    if (saveStatus === 'saving') return; // Prevent double submission

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
                className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-black/20 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                style={{ borderRadius: '0.5rem' }}
                />
                <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
                title={showApiKey ? "Hide API Key" : "Show API Key"}
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
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 ${
                saveStatus === 'saved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
                {saveStatus === 'saving' && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {saveStatus === 'saved' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete All Data
            </button>
          </SettingItem>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={onRunTests}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Run Diagnostics</span>
            </button>

            <button
              onClick={onDownloadLogs}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Download Logs</span>
            </button>

            <button
              onClick={onShowDataStructure}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
               <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Data Structure</span>
            </button>
          </div>
      </div>
    </div>
  );
};
