
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SettingItem } from './SettingItem';

type GeneralSettingsProps = {
  onClearAllChats: () => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
};

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onClearAllChats, onRunTests, onDownloadLogs, apiKey, onSaveApiKey }) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
        await onSaveApiKey(localApiKey);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
        setSaveStatus('error');
        setSaveError(error.message || 'Failed to save and verify API Key.');
    }
  };
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      onClearAllChats();
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xl font-bold text-content-primary mb-4 px-1">General</h3>

      <SettingItem 
        label="Gemini API Key" 
        description="Stored securely in your browser."
        layout="col"
      >
        <div className="flex gap-2">
          <input
            type="password"
            value={localApiKey}
            onChange={e => setLocalApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="flex-1 p-2 border border-border rounded-lg bg-layer-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main text-content-primary"
          />
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 text-sm font-semibold text-text-inverted bg-primary-main hover:bg-primary-hover rounded-lg transition-colors min-w-[80px] disabled:opacity-70"
          >
            {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '✓' : 'Save'}
          </button>
        </div>
        {saveStatus === 'error' && saveError && (
          <p className="text-sm text-status-error-text mt-2">{saveError}</p>
        )}
      </SettingItem>
      
      <SettingItem 
        label="Clear Conversations" 
        description="Delete all chat history permanently."
      >
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm font-semibold text-status-error-text bg-status-error-bg hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
        >
          Delete All
        </button>
      </SettingItem>

      <SettingItem 
        label="Diagnostic Tests" 
        description="Run automated system checks."
      >
        <button
          onClick={onRunTests}
          className="px-3 py-1.5 text-sm font-semibold text-primary-text bg-primary-subtle hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md transition-colors"
        >
          Run Tests
        </button>
      </SettingItem>

      <SettingItem 
        label="Logs" 
        description="Download session logs for debugging."
      >
        <button
          onClick={onDownloadLogs}
          className="px-3 py-1.5 text-sm font-semibold text-content-primary bg-layer-2 hover:bg-layer-3 rounded-md transition-colors"
        >
          Download
        </button>
      </SettingItem>
    </div>
  );
};
