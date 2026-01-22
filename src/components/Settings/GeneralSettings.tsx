
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
  provider: 'gemini' | 'openrouter' | 'ollama';
  openRouterApiKey: string;
  onProviderChange: (provider: 'gemini' | 'openrouter' | 'ollama') => void;
  ollamaHost?: string;
  onSaveOllamaHost?: (host: string) => Promise<void> | void;
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
            group relative flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#09090b] w-full sm:w-auto
            ${danger 
                ? 'bg-white dark:bg-white/5 border-red-200/70 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 focus:ring-red-500' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none focus:ring-indigo-500'
            }
        `}
    >
        <div className={`
            flex items-center justify-center w-8 h-8 rounded-xl transition-transform duration-300 group-hover:scale-110 flex-shrink-0
            ${danger ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-100 dark:bg-white/10'}
        `}>
            {icon}
        </div>
        <span className="truncate">{title}</span>
    </button>
);

const ApiKeyInput = ({ label, value, placeholder, onSave, buttonLabel, description, isPassword = true }: any) => {
    const [inputValue, setInputValue] = useState(value);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Track mounted state to prevent state updates on unmounted component
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => setInputValue(value), [value]);

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(inputValue);
            if (isMounted.current) {
                setIsSaved(true);
                setTimeout(() => {
                    if (isMounted.current) setIsSaved(false);
                }, 2000);
            }
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    };

    return (
        <form className="flex flex-col gap-2 w-full max-w-full" onSubmit={handleSave}>
            {label && <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">{label}</label>}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 group min-w-[200px] w-full sm:w-auto">
                    <input
                        type={isPassword ? "password" : "text"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={placeholder}
                        autoComplete={isPassword ? "new-password" : "off"}
                        className="w-full pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSaving || !inputValue}
                    className={`
                        px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] w-full sm:w-auto
                        ${isSaved 
                            ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' 
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                        }
                    `}
                >
                    {isSaving ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : isSaved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        buttonLabel || 'Save'
                    )}
                </button>
            </div>
            {description && <p className="text-[11px] text-slate-500 dark:text-slate-500 px-1">{description}</p>}
        </form>
    );
};

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
    onClearAllChats, onRunTests, onDownloadLogs, onShowDataStructure, onExportAllChats, 
    apiKey, onSaveApiKey, theme, setTheme, serverUrl, onSaveServerUrl,
    provider, openRouterApiKey, onProviderChange, ollamaHost, onSaveOllamaHost
}) => {
    return (
        <div className="space-y-10 pb-12 w-full max-w-full overflow-hidden">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">General Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage API keys, connectivity, and system preferences.</p>
            </div>

            <section className="space-y-6 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">AI Provider</h4>
                </div>

                <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 w-full sm:w-fit">
                    <SelectDropdown
                        options={PROVIDER_OPTIONS}
                        value={provider}
                        onChange={(val) => onProviderChange(val as any)}
                        className="w-full sm:w-64"
                        triggerClassName="bg-white dark:bg-[#1e1e1e] border-transparent shadow-sm rounded-lg px-4 py-2"
                    />
                </div>

                {provider === 'gemini' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                        <ApiKeyInput 
                            label="Google Gemini API Key" 
                            value={apiKey} 
                            placeholder="sk-..." 
                            onSave={(key: string) => onSaveApiKey(key, 'gemini')}
                            description="Required for Gemini models. Stored securely in your browser."
                        />
                         <div className="text-[11px] text-slate-400">
                            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Get one from Google AI Studio</a>.
                        </div>
                    </div>
                )}

                {provider === 'openrouter' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                        <ApiKeyInput 
                            label="OpenRouter API Key" 
                            value={openRouterApiKey} 
                            placeholder="sk-or-..." 
                            onSave={(key: string) => onSaveApiKey(key, 'openrouter')}
                            description="Required for OpenRouter. Stored securely in your browser."
                        />
                         <div className="text-[11px] text-slate-400">
                            Don't have a key? <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Get one from OpenRouter</a>.
                        </div>
                    </div>
                )}
                
                {provider === 'ollama' && (
                    <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                        <ApiKeyInput 
                            label="Ollama Host URL" 
                            value={ollamaHost || ''} 
                            placeholder="http://localhost:11434" 
                            onSave={(val: string) => onSaveOllamaHost && onSaveOllamaHost(val)}
                            buttonLabel="Save Host"
                            description="Enter the URL of your Ollama instance"
                            isPassword={false}
                        />
                        <ApiKeyInput 
                            label="Auth Header (Optional)" 
                            value={apiKey} // Reusing generic apiKey field for Ollama Auth if needed
                            placeholder="Bearer token..." 
                            onSave={(key: string) => onSaveApiKey(key, 'ollama')}
                            buttonLabel="Save Key"
                            description="Only needed if your Ollama instance requires authentication."
                        />
                         <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                            <p className="font-bold mb-1">Note for Localhost:</p>
                            <p>If running Ollama locally, you may need to configure CORS on your Ollama server or use a tunnel if accessing from a different device.</p>
                            <code className="block mt-2 bg-slate-200 dark:bg-black/30 p-2 rounded">OLLAMA_ORIGINS="*" ollama serve</code>
                        </div>
                    </div>
                )}
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />

            {/* Appearance */}
            <section className="space-y-6 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Appearance</h4>
                </div>

                <div className="space-y-4 w-full">
                    {/* Explicitly allow wrapping for mobile */}
                    <SettingItem label="Theme Preference" description="Choose your preferred visual theme." wrapControls={true}>
                        <div className="w-full sm:w-auto min-w-[200px]">
                           <ThemeToggle theme={theme} setTheme={setTheme} variant="cards" />
                        </div>
                    </SettingItem>
                </div>
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />
            
            {/* Connectivity */}
            <section className="space-y-6 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2 12h20"/><path d="M2 12l5-5"/><path d="M2 12l5 5"/><path d="M22 12l-5-5"/><path d="M22 12l-5 5"/><rect x="8" y="7" width="8" height="10" rx="2"/></svg>
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Connectivity</h4>
                </div>
                 <ApiKeyInput 
                    label="Backend Server URL" 
                    value={serverUrl} 
                    placeholder="http://localhost:3001" 
                    onSave={onSaveServerUrl}
                    buttonLabel="Update"
                    description="Override the default backend URL (e.g., for testing)."
                    isPassword={false}
                />
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full" />

            {/* Data & Actions */}
            <section className="space-y-6 w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Data & Maintenance</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    <ActionButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                        title="Export All Data"
                        onClick={onExportAllChats}
                    />
                    <ActionButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                        title="Download Logs"
                        onClick={onDownloadLogs}
                    />
                    <ActionButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                        title="Run Diagnostics"
                        onClick={onRunTests}
                    />
                    <ActionButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                        title="Debug Structure"
                        onClick={onShowDataStructure}
                    />
                     <ActionButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>}
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
