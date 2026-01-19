/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SettingItem } from './SettingItem';
import { ThemeToggle } from '../Sidebar/ThemeToggle';
import type { Theme } from '../../hooks/useTheme';
import { SelectDropdown } from '../UI/SelectDropdown';

type GeneralSettingsProps = {
  onClearAllChats: () => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  onShowDataStructure: () => void;
  onExportAllChats: () => void;
  apiKey: string;
  onSaveApiKey: (key: string, provider: 'gemini' | 'openrouter' | 'ollama') => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  serverUrl: string;
  onSaveServerUrl: (url: string) => Promise<boolean>;
  ollamaHost: string;
  onSaveOllamaHost: (host: string) => void;
  provider: 'gemini' | 'openrouter' | 'ollama';
  openRouterApiKey: string;
  onProviderChange: (provider: 'gemini' | 'openrouter' | 'ollama') => void;
};

const PROVIDER_OPTIONS = [
    { id: 'gemini', label: 'Google Gemini', desc: 'Default' },
    { id: 'openrouter', label: 'OpenRouter', desc: 'Access to Claude, GPT, etc.' },
    { id: 'ollama', label: 'Ollama', desc: 'Local or Hosted Instance' }
];

const ActionButton = ({ 
    icon, 
    title, 
    onClick, 
    danger = false 
}: { icon: React.ReactNode, title: string, onClick: () => void, danger?: boolean }) => (
    <button 
        onClick={onClick}
        className={`
            group relative flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#09090b]
            ${danger 
                ? 'bg-white dark:bg-white/5 border-red-200/70 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 focus:ring-red-500' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none focus:ring-indigo-500'
            }
            active:scale-[0.98]
        `}
    >
        <span className={`transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${danger ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
            {icon}
        </span>
        <span>{title}</span>
    </button>
);

const ApiKeyInput = ({ 
    value, 
    onSave, 
    placeholder, 
    description,
    isOptional = false,
    provider = 'gemini',
    onProviderChange,
    label,
    isHost = false
}: { 
    value: string, 
    onSave: (key: string, provider: 'gemini' | 'openrouter' | 'ollama') => Promise<void> | void, 
    placeholder: string,
    description: string,
    isOptional?: boolean,
    provider: 'gemini' | 'openrouter' | 'ollama',
    onProviderChange?: (provider: 'gemini' | 'openrouter' | 'ollama') => void,
    label?: string,
    isHost?: boolean
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [showKey, setShowKey] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (saveStatus === 'saving') return;

        setSaveStatus('saving');
        setSaveError(null);

        try {
            await onSave(localValue, provider);
            if (isMounted.current) {
                setSaveStatus('saved');
                setTimeout(() => {
                    if (isMounted.current) setSaveStatus('idle');
                }, 2000);
            }
        } catch (err: any) {
            console.error("Failed to save key:", err);
            if (isMounted.current) {
                setSaveStatus('error');
                setSaveError(err.message || "Failed to save key");
            }
        }
    };

    return (
        <div className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {label || (isHost ? 'Connection Host' : 'API Credential')}
                        {isOptional && <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Optional</span>}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                </div>
                {onProviderChange && (
                     <div className="flex-shrink-0">
                         {/* Provider Badge */}
                         <div className="px-3 py-1 rounded-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
                             <span className={`w-2 h-2 rounded-full ${provider === 'gemini' ? 'bg-blue-500' : provider === 'openrouter' ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                             {provider === 'gemini' ? 'Google Gemini' : provider === 'openrouter' ? 'OpenRouter' : 'Ollama'}
                         </div>
                     </div>
                )}
            </div>

            <form onSubmit={handleSave} className="relative group">
                <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                        {isHost ? (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        )}
                    </div>
                    
                    <input
                        type={showKey || isHost ? "text" : "password"}
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        placeholder={placeholder}
                        className={`
                            w-full pl-10 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl 
                            text-sm font-mono text-slate-700 dark:text-slate-200 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
                            transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500
                            ${saveStatus === 'error' ? 'border-red-300 ring-2 ring-red-500/20' : ''}
                        `}
                    />

                    <div className="absolute right-2 flex items-center gap-1">
                        {!isHost && (
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                                {showKey ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" /><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                )}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saveStatus === 'saving' || localValue === value}
                            className={`
                                p-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                ${saveStatus === 'saved' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : saveStatus === 'saving'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : localValue !== value
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                                            : 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500 cursor-not-allowed'
                                }
                            `}
                        >
                             {saveStatus === 'saved' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                             ) : saveStatus === 'saving' ? (
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                             )}
                        </button>
                    </div>
                </div>
                {saveError && (
                    <p className="mt-2 text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">{saveError}</p>
                )}
            </form>
        </div>
    );
};

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
    onClearAllChats, onRunTests, onDownloadLogs, onShowDataStructure, onExportAllChats, 
    apiKey, onSaveApiKey,
    theme, setTheme, serverUrl, onSaveServerUrl,
    provider, openRouterApiKey, onProviderChange, ollamaHost, onSaveOllamaHost
}) => {
  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">General Configuration</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage connectivity, appearance, and data.</p>
      </div>

      {/* Connectivity Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" /></svg>
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">AI Provider</h4>
        </div>

        <SettingItem 
            label="Select Provider" 
            description="Choose the backend AI service."
        >
            <div className="w-full sm:w-[320px]">
                <SelectDropdown
                    value={provider}
                    onChange={(val) => onProviderChange(val as any)}
                    options={PROVIDER_OPTIONS}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
                />
            </div>
        </SettingItem>

        <div className="space-y-4">
             {/* Gemini API Key */}
             {provider === 'gemini' && (
                 <ApiKeyInput 
                     value={apiKey} 
                     onSave={(k) => onSaveApiKey(k, 'gemini')}
                     placeholder="Enter Google Gemini API Key"
                     description="Required for all AI features. Key is stored locally."
                     label="Gemini API Key"
                     provider="gemini"
                 />
             )}

             {/* OpenRouter API Key */}
             {provider === 'openrouter' && (
                 <ApiKeyInput 
                     value={openRouterApiKey} 
                     onSave={(k) => onSaveApiKey(k, 'openrouter')}
                     placeholder="Enter OpenRouter API Key"
                     description="Access various models (Claude, GPT, etc.)."
                     label="OpenRouter API Key"
                     provider="openrouter"
                 />
             )}

             {/* Ollama Host & Key */}
             {provider === 'ollama' && (
                 <div className="space-y-4 w-full">
                     <ApiKeyInput 
                         value={ollamaHost} 
                         onSave={(h) => onSaveOllamaHost(h)}
                         placeholder="http://127.0.0.1:11434"
                         description="URL of your running Ollama instance."
                         label="Ollama Host URL"
                         provider="ollama"
                         isHost={true}
                     />
                     <ApiKeyInput 
                         value={apiKey} 
                         onSave={(k) => onSaveApiKey(k, 'ollama')}
                         placeholder="Enter Optional API Key"
                         description="Optional key if your Ollama instance requires auth."
                         label="Ollama API Key (Optional)"
                         provider="ollama"
                         isOptional={true}
                     />
                 </div>
             )}

             <ApiKeyInput 
                value={serverUrl} 
                onSave={async (url) => { await onSaveServerUrl(url); }}
                placeholder="Default (Relative Path)"
                description="Custom Backend URL (optional). Leave empty for default."
                label="Backend Server URL"
                isHost={true}
                provider={provider}
                isOptional={true}
            />
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />

      {/* Appearance */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Appearance</h4>
        </div>
        
        <SettingItem 
            label="Theme Preference" 
            description="Choose your preferred visual style."
            layout="col"
        >
            <ThemeToggle theme={theme} setTheme={setTheme} variant="cards" />
        </SettingItem>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />

      {/* Data Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Data Management</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                title="Export History" 
                onClick={onExportAllChats} 
            />
            <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
                title="Download Logs" 
                onClick={onDownloadLogs} 
            />
            <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                title="Run Diagnostics" 
                onClick={onRunTests} 
            />
             <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
                title="Debug Data" 
                onClick={onShowDataStructure} 
            />
            <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>}
                title="Clear All Chats" 
                onClick={onClearAllChats} 
                danger 
            />
        </div>
      </section>
    </div>
  );
};

export default GeneralSettings;