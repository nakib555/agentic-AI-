
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

const ActionCard = ({ 
    icon, 
    title, 
    desc, 
    onClick, 
    danger = false 
}: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, danger?: boolean }) => (
    <button 
        onClick={onClick}
        className={`
            flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left w-full h-full
            ${danger 
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 group' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-md'
            }
        `}
    >
        <div className={`p-2.5 rounded-lg mb-3 ${danger ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
            {icon}
        </div>
        <h4 className={`font-bold text-sm mb-1 ${danger ? 'text-red-800 dark:text-red-200' : 'text-slate-800 dark:text-slate-100'}`}>
            {title}
        </h4>
        <p className={`text-xs ${danger ? 'text-red-600/80 dark:text-red-300/70' : 'text-slate-500 dark:text-slate-400'}`}>
            {desc}
        </p>
    </button>
);

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
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
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">General Settings</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage connection, appearance, and data.</p>
      </div>

      <SettingItem label="Gemini API Key" description="Required for models to appear." layout="col">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${localApiKey ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            </div>
            <input
                type={showApiKey ? "text" : "password"}
                autoComplete="off"
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full pl-10 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm group-hover:border-slate-400 dark:group-hover:border-white/20"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors mr-1"
                    title={showApiKey ? "Hide key" : "Show key"}
                >
                    {showApiKey ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                </button>
                <button
                    type="submit"
                    disabled={saveStatus === 'saving' || !localApiKey}
                    className={`
                        px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm
                        ${saveStatus === 'saved' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
             {saveStatus === 'error' && saveError ? (
                 <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                     {saveError}
                 </p>
             ) : (
                 <span className="text-xs text-slate-400">Your key is stored locally in your browser.</span>
             )}
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                 Get API Key 
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
             </a>
          </div>
        </form>
      </SettingItem>

      <SettingItem label="Appearance">
        <div className="w-full max-w-[320px]">
            <ThemeToggle theme={theme} setTheme={setTheme} isCollapsed={false} isDesktop={true} />
        </div>
      </SettingItem>

      <div className="pt-4">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 px-1">Data & Debugging</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ActionCard 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                  title="Download Logs"
                  desc="Save debug logs to file"
                  onClick={onDownloadLogs}
              />
              <ActionCard 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>}
                  title="Data Tree"
                  desc="View file structure"
                  onClick={onShowDataStructure}
              />
              <ActionCard 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>}
                  title="Clear All Data"
                  desc="Permanently delete chats"
                  onClick={onClearAllChats}
                  danger
              />
          </div>
      </div>
    </div>
  );
};

export default React.memo(GeneralSettings);
