/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

type GeneralSettingsProps = {
  onClearAllChats: () => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">{description}</p>
        {children}
    </div>
);

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onClearAllChats, onRunTests, onDownloadLogs, apiKey, onSaveApiKey }) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onSaveApiKey(localApiKey);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      onClearAllChats();
    }
  };
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">General</h3>

      <SettingField 
        label="Gemini API Key" 
        description="Your API key is stored locally in your browser's local storage and sent securely with each request."
      >
        <div className="flex items-center gap-2 max-w-sm">
          <input
            type="password"
            value={localApiKey}
            onChange={e => setLocalApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full p-2 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors w-24"
          >
            {saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </SettingField>
      
      <SettingField 
        label="Clear all chats" 
        description="This will permanently delete all of your chat history."
      >
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Clear all chats
        </button>
      </SettingField>
      <SettingField 
        label="Run Diagnostic Tests" 
        description="Run a suite of automated tests to verify AI functionality, component rendering, and end-to-end response generation. This may take a few minutes."
      >
        <button
          onClick={onRunTests}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          Run Diagnostic Tests
        </button>
      </SettingField>
      <SettingField 
        label="Download Console Log" 
        description="Download a copy of the browser's console log for this session. This is useful for debugging."
      >
        <button
          onClick={onDownloadLogs}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          Download Log File
        </button>
      </SettingField>
    </div>
  );
};
